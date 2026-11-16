"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, RotateCcw, Scissors, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PreviewRuntime } from "@/components/runtime/preview-runtime";
import { useClockDriver } from "@/components/runtime/use-clock-driver";
import {
  AnimationClockController,
  framesToSeconds,
} from "@/lib/clock/clock";
import {
  bitmapToDataURL,
  downscaleToPng,
} from "@/lib/export/canvas";
import { downloadBlob, encodeFramesToVideo } from "@/lib/export/ffmpeg";
import {
  NativeVideoEncoder,
  evenDimensions,
  pickNativeCodec,
  type NativeCodecInfo,
} from "@/lib/export/native";
import { formatDimensions } from "@/lib/format";
import { getStorage } from "@/lib/projects/storage";
import type { FrameMessage } from "@/lib/protocol/messages";
import type { Project } from "@/lib/types";

type Phase = "settings" | "rendering" | "done" | "error";

const CAPTURE_TIMEOUT_MS = 30_000;

interface ExportSummary {
  engine: string;
  codec: string | null;
  frames: number;
  /** Average per-frame capture cost (sandbox raster + transfer), ms. */
  avgCaptureMs: number;
  /** First frame cost (includes cold caches), ms. */
  firstFrameMs: number;
  finalizeMs: number;
  totalMs: number;
  bytes: number;
}

/**
 * Local export screen: renders every animation frame through the same
 * sandboxed runtime the preview uses, encodes them with the browser's native
 * WebCodecs encoder (mediabunny muxing) when available, and otherwise falls
 * back to ffmpeg.wasm. Everything runs locally; nothing is uploaded.
 */
export function ExportScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [phase, setPhase] = useState<Phase>("settings");
  const [halfRes, setHalfRes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [frameStatus, setFrameStatus] = useState<{
    index: number;
    total: number;
    time: number;
  } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const videoBlobRef = useRef<Blob | null>(null);

  // Capture plumbing
  const [captureToken, setCaptureToken] = useState(0);
  const captureTokenRef = useRef(0);
  const frameResolverRef = useRef<((frame: FrameMessage) => void) | null>(null);
  const framesRef = useRef<string[]>([]);
  const halfResRef = useRef(false);
  const renderingRef = useRef(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const clock = useMemo<AnimationClockController | null>(() => {
    if (!project) return null;
    return new AnimationClockController(project.duration, project.fps);
  }, [project?.duration, project?.fps]);

  useClockDriver(clock ?? LOADING_CLOCK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getStorage().getProject(projectId);
      if (cancelled) return;
      if (!loaded) {
        setMissing(true);
        return;
      }
      setProject(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /** Structured, timestamped diagnostics for the whole render job. */
  const startRenderRef = useRef<{ t0: number } | null>(null);
  const logStage = useCallback(
    (stage: string, detail?: Record<string, unknown>) => {
      const ms = startRenderRef.current
        ? Math.round(performance.now() - startRenderRef.current.t0)
        : 0;
      console.info(
        `[reosion:export] ${stage} (+${ms}ms)`,
        detail ?? {},
      );
    },
    [],
  );

  /**
   * Called by the runtime for every captured frame. Routes the frame into
   * the encoder (or the PNG fallback buffer), updates the live preview and
   * releases the capture promise.
   */
  const handleFrame = useCallback((frame: FrameMessage) => {
    if (frame.frameId !== captureTokenRef.current) return; // stale retry frame
    const resolver = frameResolverRef.current;
    frameResolverRef.current = null;
    if (!resolver) return;
    // Draw the live preview before handing control back to the render loop.
    const canvas = previewCanvasRef.current;
    if (canvas && frame.bitmap) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(frame.bitmap, 0, 0, canvas.width, canvas.height);
    }
    resolver(frame);
  }, []);

  const startRender = useCallback(async () => {
    if (!project || !clock || renderingRef.current) return;
    renderingRef.current = true;
    halfResRef.current = halfRes;
    framesRef.current = [];
    captureTokenRef.current = captureToken;
    setPhase("rendering");
    setProgress(0);
    setError(null);
    setSummary(null);
    setFrameStatus(null);
    setStageLabel("Rendering frames…");
    startRenderRef.current = { t0: performance.now() };

    // Track tab visibility: rAF-dependent work stalls when backgrounded.
    const hiddenRef = { current: document.visibilityState === "hidden" };
    const onVisibility = () => {
      hiddenRef.current = document.visibilityState === "hidden";
    };
    document.addEventListener("visibilitychange", onVisibility);

    let encoder: NativeVideoEncoder | null = null;
    let codecInfo: NativeCodecInfo | null = null;

    try {
      const fps = project.fps;
      const total = clock.totalFrames;
      const scale = halfRes ? 0.5 : 1;
      const out = evenDimensions(
        Math.round(project.width * scale),
        Math.round(project.height * scale),
      );

      logStage("render-started", {
        resolution: `${out.width}x${out.height}`,
        fps,
        duration: project.duration,
        totalFrames: total,
      });

      // Encoder selection happens up-front so the whole loop can stream.
      codecInfo = await pickNativeCodec(out.width, out.height);
      if (codecInfo) {
        encoder = new NativeVideoEncoder(codecInfo, fps);
        await encoder.start();
        logStage("encoder-ready", {
          engine: "webcodecs+mediabunny",
          codec: codecInfo.codec,
        });
        setStageLabel(`Rendering frames · ${codecInfo.codec.toUpperCase()}`);
      } else {
        logStage("encoder-fallback", { engine: "ffmpeg.wasm" });
        setStageLabel("Rendering frames · ffmpeg.wasm");
      }

      let captureTotalMs = 0;
      let captureCount = 0;
      let firstFrameMs = 0;

      for (let f = 0; f < total; f++) {
        if (hiddenRef.current) {
          throw new Error(
            "Export paused: this tab was moved to the background. Keep the tab in the foreground and retry.",
          );
        }
        const time = framesToSeconds(f, fps);
        clock.seek(time);

        // Capture can occasionally stall (e.g. throttled rAF); retry the
        // frame once before failing the whole export.
        let frame: FrameMessage | null = null;
        let captureMs = 0;
        for (let attempt = 0; attempt < 2 && !frame; attempt++) {
          const attemptT0 = performance.now();
          try {
            captureTokenRef.current += 1;
            setCaptureToken(captureTokenRef.current);
            frame = await new Promise<FrameMessage>((resolve, reject) => {
              const timer = window.setTimeout(
                () => reject(new Error(`Timed out capturing frame ${f}`)),
                CAPTURE_TIMEOUT_MS,
              );
              frameResolverRef.current = (msg) => {
                window.clearTimeout(timer);
                resolve(msg);
              };
            });
          } catch (e) {
            frameResolverRef.current = null;
            if (attempt === 1) throw e;
            logStage("capture-retry", { frame: f });
            await new Promise((r) => window.setTimeout(r, 500));
            continue;
          }
          captureMs = performance.now() - attemptT0;
        }
        if (!frame) throw new Error(`Failed to capture frame ${f}`);

        captureTotalMs += captureMs;
        captureCount++;
        if (f === 0) firstFrameMs = captureMs;

        setFrameStatus({ index: f + 1, total, time });

        // Feed the encoder and immediately release the bitmap's memory.
        if (encoder && frame.bitmap) {
          await encoder.addBitmap(frame.bitmap, time, 1 / fps);
          frame.bitmap.close();
        } else {
          let png = frame.dataURL;
          if (png && scale !== 1) {
            try {
              png = await downscaleToPng(png, scale);
            } catch {
              // Keep the full-resolution frame on canvas failure.
            }
          } else if (!png && frame.bitmap) {
            png = await bitmapToDataURL(frame.bitmap, scale);
          }
          if (!png) throw new Error(`Frame ${f} arrived without pixel data`);
          frame.bitmap?.close();
          if (scale !== 1) {
            try {
              png = await downscaleToPng(png, scale);
            } catch {
              // Keep the full-resolution frame on canvas failure.
            }
          }
          framesRef.current.push(png);
        }

        setProgress(0.05 + ((f + 1) / total) * 0.85);
      }

      logStage("frames-rendered", {
        frames: captureCount,
        avgCaptureMs: Math.round(captureTotalMs / Math.max(1, captureCount)),
        firstFrameMs: Math.round(firstFrameMs),
      });

      const finalizeT0 = performance.now();
      let blob: Blob;
      if (encoder) {
        setStageLabel("Finalizing video…");
        setProgress(0.95);
        blob = await encoder.finish();
      } else {
        setStageLabel("Encoding video (ffmpeg.wasm)…");
        setProgress(0.9);
        blob = await encodeFramesToVideo(framesRef.current, fps, (p) =>
          setProgress(0.9 + p * 0.1),
        );
      }
      framesRef.current = [];
      const finalizeMs = Math.round(performance.now() - finalizeT0);
      const totalMs = Math.round(performance.now() - startRenderRef.current.t0);

      logStage("export-complete", { bytes: blob.size, finalizeMs, totalMs });

      const engine =
        codecInfo && codecInfo.codec === "avc"
          ? "WebCodecs · H.264"
          : codecInfo
            ? `WebCodecs · ${codecInfo.codec.toUpperCase()}`
            : "ffmpeg.wasm · H.264";

      // Trust only a non-empty result.
      if (blob.size === 0) throw new Error("encoder produced an empty file");

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      videoBlobRef.current = blob;
      setSummary({
        engine,
        codec: codecInfo?.codec ?? "libx264",
        frames: captureCount,
        avgCaptureMs: Math.round(captureTotalMs / Math.max(1, captureCount)),
        firstFrameMs: Math.round(firstFrameMs),
        finalizeMs,
        totalMs,
        bytes: blob.size,
      });
      setProgress(1);
      setPhase("done");
      // Auto-download; a visible Download button always remains available.
      const slug =
        project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "animation";
      downloadBlob(blob, `${slug}.mp4`);
    } catch (e) {
      logStage("render-error", {
        stage: encoder ? "render/finalize" : "render/capture",
        message: e instanceof Error ? e.message : String(e),
      });
      console.error("[reosion:export] failure", e);
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      document.removeEventListener("visibilitychange", onVisibility);
      renderingRef.current = false;
      frameResolverRef.current = null;
    }
  }, [project, clock, halfRes, captureToken, logStage]);

  // `?autostart=1` (used by the /dev render benchmark) kicks off the render
  // shortly after mount, giving the runtime a moment to boot and load code.
  const startRenderLatestRef = useRef(startRender);
  startRenderLatestRef.current = startRender;
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("autostart") !== "1") {
      return;
    }
    const timer = window.setTimeout(
      () => void startRenderLatestRef.current(),
      2500,
    );
    return () => window.clearTimeout(timer);
  }, []);

  if (missing) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">
          This project could not be found.
        </p>
        <Button variant="outline" size="sm" render={<Link href="/dashboard" />}>
          Back to projects
        </Button>
      </div>
    );
  }

  if (!project || !clock) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          Loading export…
        </div>
      </div>
    );
  }

  const encoded = encodeURIComponent(projectId);
  const halfWidth = Math.round(project.width / 2);
  const halfHeight = Math.round(project.height / 2);
  const outWidth = halfRes ? halfWidth : project.width;
  const outHeight = halfRes ? halfHeight : project.height;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Button variant="ghost" size="sm" render={<Link href={`/projects/${encoded}`} />}>
          <ArrowLeft />
          Editor
        </Button>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            Export · {project.name}
          </p>
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {phase === "settings" ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-muted-foreground" aria-hidden />
                <h1 className="text-sm font-medium text-foreground">
                  Export settings
                </h1>
              </div>
              <dl className="mt-4 space-y-1.5 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Source</dt>
                  <dd className="text-foreground">
                    {formatDimensions(project.width, project.height)} · {project.fps}fps
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Duration</dt>
                  <dd className="text-foreground">{project.duration}s</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Format</dt>
                  <dd className="text-foreground">MP4 (H.264)</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium text-foreground">
                  Resolution
                </p>
                <div className="flex gap-2">
                  <ResolutionOption
                    selected={!halfRes}
                    onClick={() => setHalfRes(false)}
                    label={`Full · ${project.width}×${project.height}`}
                  />
                  <ResolutionOption
                    selected={halfRes}
                    onClick={() => setHalfRes(true)}
                    label={`Half · ${halfWidth}×${halfHeight}`}
                  />
                </div>
              </div>

              <p className="mt-4 text-[10px] leading-4 text-muted-foreground">
                Frames are rendered locally through the animation runtime and
                encoded with your browser&apos;s native video encoder (ffmpeg.wasm
                fallback). The video never leaves your machine. Keep this tab in
                the foreground while exporting.
              </p>

              <Button className="mt-5 w-full" onClick={() => void startRender()}>
                <Scissors />
                Start render
              </Button>
            </div>
          ) : phase === "rendering" ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <h1 className="text-sm font-medium text-foreground">
                Rendering your animation
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">{stageLabel}</p>
              <canvas
                ref={previewCanvasRef}
                width={Math.max(2, outWidth)}
                height={Math.max(2, outHeight)}
                className="mt-4 w-full rounded-md bg-black"
                style={{ aspectRatio: `${outWidth} / ${outHeight}` }}
              />
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>
                  {frameStatus
                    ? `Frame ${frameStatus.index} / ${frameStatus.total} · ${frameStatus.time.toFixed(3)}s`
                    : "Waiting for first frame…"}
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          ) : phase === "done" && videoUrl ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <h1 className="text-sm font-medium text-foreground">
                Export complete
              </h1>

              <video
                src={videoUrl}
                className="mt-4 w-full rounded-md bg-black"
                style={{ aspectRatio: `${outWidth} / ${outHeight}` }}
                controls
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Primary identity: filename */}
              <p className="mt-3 truncate font-mono text-xs text-foreground">
                {(project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "animation")}.mp4
              </p>

              {/* Compact metadata line */}
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {outWidth} × {outHeight} · {project.fps} FPS · {project.duration}s
              </p>
              {summary ? (
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {summary.engine.split("·").pop()?.trim() ?? summary.codec} ·{" "}
                  {summary.frames} frames
                </p>
              ) : null}

              {/* Render performance, concise */}
              {summary ? (
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  Render time: {(summary.totalMs / 1000).toFixed(1)}s
                  {summary.totalMs < project.duration * 1000
                    ? " · Faster than realtime"
                    : summary.totalMs > project.duration * 1000
                      ? " · Slower than realtime"
                      : ""}
                </p>
              ) : null}

              <div className="mt-5 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const blob = videoBlobRef.current;
                    if (!blob) return;
                    const slug =
                      project.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "") || "animation";
                    downloadBlob(blob, `${slug}.mp4`);
                  }}
                >
                  <Download />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  render={<Link href={`/projects/${encoded}`} />}
                >
                  Back to editor
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  setPhase("settings");
                  setVideoUrl(null);
                  setProgress(0);
                  setDetailsOpen(false);
                }}
              >
                <RotateCcw />
                Export again
              </Button>

              {/* Technical details accordion (collapsed by default) */}
              {summary ? (
                <div className="mt-4 border-t border-border pt-3">
                  <button
                    type="button"
                    aria-expanded={detailsOpen}
                    aria-controls="render-details-panel"
                    onClick={() => setDetailsOpen((v) => !v)}
                    className="flex w-full items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span
                      aria-hidden
                      className="inline-block w-3 text-center transition-transform duration-150"
                      style={{
                        transform: detailsOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      ▸
                    </span>
                    Render details
                  </button>
                  <div
                    id="render-details-panel"
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{
                      gridTemplateRows: detailsOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <dl className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground">
                        <div className="flex justify-between">
                          <dt>Total render time</dt>
                          <dd className="text-foreground">
                            {(summary.totalMs / 1000).toFixed(1)}s
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Average capture</dt>
                          <dd className="text-foreground">
                            {summary.avgCaptureMs}ms / frame
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>First frame</dt>
                          <dd className="text-foreground">
                            {summary.firstFrameMs}ms
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Finalize</dt>
                          <dd className="text-foreground">
                            {summary.finalizeMs}ms
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Frames</dt>
                          <dd className="text-foreground">{summary.frames}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Encoder</dt>
                          <dd className="text-foreground">{summary.engine}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>File size</dt>
                          <dd className="text-foreground">
                            {(summary.bytes / (1024 * 1024)).toFixed(2)} MB
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : phase === "error" ? (
            <div className="rounded-lg border border-destructive/40 bg-card p-5">
              <h1 className="text-sm font-medium text-destructive">
                Export failed
              </h1>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {error}
              </p>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => void startRender()}>
                  Retry
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  render={<Link href={`/projects/${encoded}`} />}
                >
                  Back to editor
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Hidden capture runtime: mounted from settings (warm boot) through
          rendering; unmounted afterwards to free the sandbox. It must stay
          inside the viewport (scaled down + transparent) — offscreen sandboxed
          iframes get their rAF throttled by the browser, which would stall
          captures. Visual scaling does not affect captures: the stage inside
          lays out at true project pixel size. */}
      {phase === "settings" || phase === "rendering" ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 0,
            bottom: 0,
            width: project.width,
            height: project.height,
            overflow: "hidden",
            transform: "scale(0.12)",
            transformOrigin: "bottom left",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <PreviewRuntime
            project={project}
            clock={clock}
            captureToken={captureToken}
            onFrame={handleFrame}
            onRuntimeStatus={(status) => {
              if (status.kind === "load_error" || status.kind === "render_error") {
                if (renderingRef.current) {
                  setError(status.message);
                  setPhase("error");
                }
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ResolutionOption({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-1 rounded-md border px-3 py-2 font-mono text-[10px] transition-colors ${
        selected
          ? "border-brand/60 bg-brand/10 text-foreground"
          : "border-border text-muted-foreground hover:border-muted-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

// Placeholder clock while the project loads; a zero-duration controller
// never plays, so the driver's rAF loop stays idle.
const LOADING_CLOCK = new AnimationClockController(0, 30);
