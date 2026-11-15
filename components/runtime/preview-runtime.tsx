"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CompileDiagnostic,
  compileUserCode,
} from "@/lib/compiler/compile";
import type { AnimationClockController } from "@/lib/clock/clock";
import {
  type RuntimeMessage,
  isRuntimeMessage,
} from "@/lib/protocol/messages";
import { STAGE_FILE_NAME } from "@/lib/projects/templates";
import type { Project } from "@/lib/types";

export type CompileStatus =
  | { kind: "idle" }
  | { kind: "compiling" }
  | { kind: "ok" }
  | { kind: "errors"; errors: CompileDiagnostic[] };

export type RuntimeStatus =
  | { kind: "booting" }
  | { kind: "ready" }
  | { kind: "load_error"; message: string; stack?: string }
  | { kind: "render_error"; message: string; stack?: string };

interface StageInfo {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

interface PreviewRuntimeProps {
  project: Pick<Project, "width" | "height" | "fps" | "duration"> & { code: string };
  clock: AnimationClockController;
  onCompileStatus?: (status: CompileStatus) => void;
  onRuntimeStatus?: (status: RuntimeStatus) => void;
  /** Increment to request a single frame capture (thumbnail/export). */
  captureToken?: number;
  /** Called with the captured PNG data URL. */
  onFrame?: (dataURL: string) => void;
  className?: string;
}

/**
 * The host of the sandboxed preview iframe (the parent side of
 * `lib/protocol/messages.ts`).
 *
 * Responsibilities:
 *  - boot the runtime once (EXECUTE) and wait for READY
 *  - compile user code locally and push LOAD_CODE (debounced)
 *  - forward every clock move as an exact SET_TIME timestamp
 *
 * The iframe is positioned at its true pixel size (project.width ×
 * project.height); the parent visually scales it with CSS transforms.
 */
export function PreviewRuntime({
  project,
  clock,
  onCompileStatus,
  onRuntimeStatus,
  captureToken,
  onFrame,
  className,
}: PreviewRuntimeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const compileTokenRef = useRef(0);
  const codeRef = useRef(project.code);
  const [runtimeLoaded, setRuntimeLoaded] = useState(false);
  // Incremented on READY so the compile pipeline re-runs even when
  // `runtimeLoaded` was already true (React bails out on same-value updates).
  const [readyNonce, setReadyNonce] = useState(0);

  const stage: StageInfo = {
    width: project.width,
    height: project.height,
    fps: project.fps,
    duration: project.duration,
  };
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const send = useCallback(
    (message: unknown) => {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    },
    [],
  );

  // Boot the runtime once per mount.
  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;

    const boot = async () => {
      try {
        const response = await fetch("/runtime.js");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const source = await response.text();
        if (cancelled) return;
        setRuntimeLoaded(true);
        send({ type: "EXECUTE", sources: [source] });
      } catch (error) {
        if (!cancelled) {
          onRuntimeStatus?.({
            kind: "load_error",
            message: `Runtime failed to load: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [send, onRuntimeStatus]);

  // Runtime -> parent messages.
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isRuntimeMessage(event.data)) return;
      const message = event.data as RuntimeMessage;
      console.debug("[reosion:host] runtime msg", message.type);
      switch (message.type) {
        case "READY": {
          readyRef.current = true;
          setRuntimeLoaded(true);
          setReadyNonce((n) => n + 1);
          break;
        }
        case "FRAME": {
          onFrame?.(message.dataURL);
          break;
        }
        case "RUNTIME_ERROR":
        case "RENDER_ERROR": {
          onRuntimeStatus?.({
            kind: "load_error",
            message: message.error.message,
            stack: message.error.stack,
          });
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onRuntimeStatus is a stable callback from the workspace
  }, [onRuntimeStatus]);

  // Compile + load pipeline. Debounced; latest code wins.
  const compileAndLoad = useCallback(
    async (code: string) => {
      codeRef.current = code;
      const token = ++compileTokenRef.current;
      await new Promise((r) => setTimeout(r, 250));
      if (token !== compileTokenRef.current) return; // superseded
      if (!readyRef.current || !runtimeLoaded) return;

      onCompileStatus?.({ kind: "compiling" });
      const result = await compileUserCode(code);
      if (token !== compileTokenRef.current) return;

      if (!result.ok) {
        onCompileStatus?.({ kind: "errors", errors: result.errors });
        return;
      }
      onCompileStatus?.({ kind: "ok" });
      // Park the runtime at the current clock position after loads.
      send({
        type: "LOAD_CODE",
        code: result.js,
        stage: stageRef.current,
        time: clock.time,
      });
    },
    [send, onCompileStatus, clock, runtimeLoaded],
  );

  // Reload code when it becomes ready (READY) or when it changes.
  useEffect(() => {
    void compileAndLoad(project.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on code readyNonce changes
  }, [project.code, compileAndLoad, readyNonce]);

  // Forward clock moves (playback + seeks) as exact timestamps.
  useEffect(() => {
    if (!runtimeLoaded) return;
    const unsubscribe = clock.subscribe(() => {
      if (!readyRef.current) return;
      send({ type: "SET_TIME", time: clock.snapshot().time });
    });
    send({ type: "SET_TIME", time: clock.snapshot().time });
    return unsubscribe;
  }, [clock, runtimeLoaded, send]);

  // Capture a frame on demand (thumbnails / export).
  useEffect(() => {
    if (!captureToken || !runtimeLoaded || !readyRef.current) return;
    send({ type: "CAPTURE_FRAME", frameId: captureToken });
  }, [captureToken, runtimeLoaded, send]);

  return (
    <iframe
      ref={iframeRef}
      src="/sandbox"
      title={STAGE_FILE_NAME}
      sandbox="allow-scripts"
      className={className}
      style={{
        border: 0,
        width: project.width,
        height: project.height,
        background: "#09090b",
      }}
    />
  );
}