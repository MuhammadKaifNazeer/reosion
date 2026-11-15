"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/timeline/timeline";
import { PreviewRuntime } from "@/components/runtime/preview-runtime";
import { StageFitter } from "@/components/runtime/stage-fitter";
import { TransportControls } from "@/components/runtime/transport-controls";
import { useClockDriver } from "@/components/runtime/use-clock-driver";
import {
  AnimationClockController,
} from "@/lib/clock/clock";
import { formatDimensions } from "@/lib/format";
import { getStorage } from "@/lib/projects/storage";
import type { Project } from "@/lib/types";

/**
 * Distraction-free viewing page. Reuses the exact same runtime, clock,
 * transport and timeline as the workspace — no duplicate playback logic.
 */
export function PreviewScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [clock, setClock] = useState<AnimationClockController | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

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
      setClock(
        new AnimationClockController(loaded.duration, loaded.fps),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
          Loading preview…
        </div>
      </div>
    );
  }

  const encoded = encodeURIComponent(projectId);

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Button variant="ghost" size="sm" render={<Link href={`/projects/${encoded}`} />}>
          <ArrowLeft />
          Editor
        </Button>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {project.name}
          </p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {project.aspectRatio} · {formatDimensions(project.width, project.height)} ·{" "}
            {project.fps}fps · {project.duration}s
          </p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" render={<Link href={`/projects/${encoded}/export`} />}>
            <Scissors />
            Export
          </Button>
        </div>
      </header>

      {/* stage: full-bleed dark letterbox, like a media player. The video
          fills the viewport as far as its aspect ratio allows. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#09090b]">
        <StageFitter width={project.width} height={project.height}>
          {(scale) => (
            <div
              className="relative overflow-hidden shadow-2xl shadow-black/60 outline-none ring-white/15 ring-1"
              style={{
                width: Math.round(project.width * scale),
                height: Math.round(project.height * scale),
              }}
            >
              <div
                style={{
                  width: project.width,
                  height: project.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <PreviewRuntime
                  project={project}
                  clock={clock}
                  onRuntimeStatus={(status) => {
                    if (status.kind === "load_error" || status.kind === "render_error") {
                      setRuntimeError(status.message);
                    } else {
                      setRuntimeError(null);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </StageFitter>

        {runtimeError ? (
          <div
            role="alert"
            className="absolute left-1/2 top-4 max-w-md -translate-x-1/2 rounded-md border border-destructive/40 bg-card px-3 py-2 text-xs text-destructive"
          >
            {runtimeError}
          </div>
        ) : null}

        {/* transport overlays the video bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <TransportControls
            project={project}
            clock={clock}
            projectId={projectId}
          />
        </div>
      </div>

      {/* timeline */}
      <div className="shrink-0 border-t border-border bg-card px-3 py-2">
        <Timeline clock={clock} />
      </div>
    </div>
  );
}

// Placeholder clock so `useClockDriver` always receives a stable value while
// the project is still loading. A zero-duration controller never plays, so
// the driver's rAF loop stays idle.
const LOADING_CLOCK = new AnimationClockController(0, 30);
