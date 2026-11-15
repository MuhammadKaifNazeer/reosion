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
import { downscaleToPng } from "@/lib/export/canvas";
import {
  downloadBlob,
  encodeFramesToVideo,
} from "@/lib/export/ffmpeg";
import { formatDimensions } from "@/lib/format";
import { getStorage } from "@/lib/projects/storage";
import type { Project } from "@/lib/types";

type Phase = "settings" | "rendering" | "done" | "error";

const CAPTURE_TIMEOUT_MS = 30_000;

/**
 * Local export screen: renders every animation frame through the same
 * sandboxed runtime the preview uses, encodes them with ffmpeg.wasm entirely
 * in the browser, and hands the resulting video back as a local Blob.
 * Nothing is ever uploaded to a server.
 */
export function ExportScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [phase, setPhase] = useState<Phase>("settings");
  const [halfRes, setHalfRes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);

  // Capture plumbing
  const [captureToken, setCaptureToken] = useState(0);
  const frameResolverRef = useRef<(() => void) | null>(null);
  const framesRef = useRef<string[]>([]);
  const halfResRef = useRef(false);
  const renderingRef = useRef(false);

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

  /**
   * Called by the runtime for every captured frame. Pushes (optionally
   * downscaled) PNG data into the frame list and releases the render loop.
   */
  const handleFrame = useCallback(async (dataURL: string) => {
    const scale = halfResRef.current ? 0.5 : 1;
    let out = dataURL;
    if (scale !== 1) {
      try {
        out = await downscaleToPng(dataURL, scale);
      } catch {
        // Fall back to the full-resolution frame on any canvas failure.
        out = dataURL;
      }
    }
    framesRef.current.push(out);
    frameResolverRef.current?.();
    frameResolverRef.current = null;
  }, []);

  const startRender = useCallback(async () => {
    if (!project || !clock || renderingRef.current) return;
    renderingRef.current = true;
    halfResRef.current = halfRes;
    framesRef.current = [];
    setPhase("rendering");
    setProgress(0);
    setError(null);
    setStageLabel("Rendering frames…");

    try {
      const total = clock.totalFrames;
      const fps = project.fps;

      for (let f = 0; f < total; f++) {
        clock.seek(framesToSeconds(f, fps));
        // Capture can occasionally stall (e.g. a backgrounded tab throttles
        // rAF); retry the frame once before failing the whole export.
        let captured = false;
        for (let attempt = 0; attempt < 2 && !captured; attempt++) {
          setCaptureToken((t) => t + 1);
          try {
            await new Promise<void>((resolve, reject) => {
              const timer = window.setTimeout(
                () => reject(new Error(`Timed out capturing frame ${f}`)),
                CAPTURE_TIMEOUT_MS,
              );
              frameResolverRef.current = () => {
                window.clearTimeout(timer);
                resolve();
              };
            });
            captured = true;
          } catch (e) {
            if (attempt === 1) throw e;
            // brief pause before retrying
            await new Promise((r) => window.setTimeout(r, 500));
          }
        }
        setProgress(((f + 1) / total) * 0.7);
      }

      setStageLabel("Encoding video (ffmpeg.wasm)…");
      const blob = await encodeFramesToVideo(
        framesRef.current,
        fps,
        (p) => setProgress(0.7 + p * 0.3),
      );

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      videoBlobRef.current = blob;
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
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      renderingRef.current = false;
      frameResolverRef.current = null;
    }
  }, [project, clock, halfRes]);

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
                encoded with ffmpeg.wasm in your browser. The video never leaves
                your machine. Keep this tab in the foreground while exporting.
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
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
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
              <p className="mt-2 text-right font-mono text-[10px] text-muted-foreground">
                {Math.round(progress * 100)}%
              </p>
            </div>
          ) : phase === "done" && videoUrl ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <h1 className="text-sm font-medium text-foreground">
                Export complete
              </h1>
              <video
                src={videoUrl}
                className="mt-4 w-full rounded-md bg-black"
                style={{ aspectRatio: `${halfRes ? halfWidth : project.width} / ${halfRes ? halfHeight : project.height}` }}
                controls
                autoPlay
                loop
                muted
                playsInline
              />
              <dl className="mt-3 space-y-1 font-mono text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <dt>File</dt>
                  <dd className="text-foreground">
                    {(project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "animation")}.mp4
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Resolution</dt>
                  <dd className="text-foreground">
                    {halfRes ? halfWidth : project.width} × {halfRes ? halfHeight : project.height}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Frame rate</dt>
                  <dd className="text-foreground">{project.fps} FPS</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Duration</dt>
                  <dd className="text-foreground">{project.duration}s</dd>
                </div>
              </dl>
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
                  onClick={() => {
                    setPhase("settings");
                    setVideoUrl(null);
                    setProgress(0);
                  }}
                >
                  <RotateCcw />
                  Export again
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                render={<Link href={`/projects/${encoded}`} />}
              >
                Back to editor
              </Button>
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
          html-to-image captures. Visual scaling does not affect captures: the
          stage inside lays out at true project pixel size. */}
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
            onFrame={(dataURL) => void handleFrame(dataURL)}
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
