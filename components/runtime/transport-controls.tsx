"use client";

import Link from "next/link";
import {
  Maximize2,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from "lucide-react";
import {
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import {
  AnimationClockController,
  formatTimecode,
  timeToFrame,
} from "@/lib/clock/clock";
import type { Project } from "@/lib/types";

/**
 * Minimal playback transport for the preview stage. The timeline underneath
 * handles scrubbing; buttons here handle play state and frame stepping.
 */
export function TransportControls({
  project,
  clock,
  projectId,
}: {
  project: Pick<Project, "width" | "height" | "fps" | "duration">;
  clock: AnimationClockController;
  projectId: string;
}) {
  const snapshot = useSyncExternalStore(
    clock.subscribe.bind(clock),
    clock.snapshot.bind(clock),
  );
  const frame = timeToFrame(snapshot.time, project.fps, project.duration);
  const ready = project.duration > 0;
  const encoded = encodeURIComponent(projectId);

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background/80 p-1 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Go to start"
        onClick={() => clock.seek(0)}
      >
        <SkipBack />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Step back one frame"
        onClick={() => clock.stepFrames(-1)}
      >
        <StepBack />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={snapshot.playing ? "Pause" : "Play"}
        disabled={!ready}
        onClick={() => clock.toggle()}
      >
        {snapshot.playing ? <Pause /> : <Play />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Step forward one frame"
        onClick={() => clock.stepFrames(1)}
      >
        <StepForward />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Go to end"
        onClick={() => clock.seek(project.duration)}
      >
        <SkipForward />
      </Button>

      <span
        className="ml-1 font-mono text-[10px] text-muted-foreground"
        aria-live="off"
        suppressHydrationWarning
      >
        {formatTimecode(snapshot.time, project.fps)} /{" "}
        {formatTimecode(project.duration, project.fps)}
        <span className="mx-1.5 text-border">|</span>
        F{String(frame).padStart(3, "0")}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open preview page"
          render={<Link href={`/projects/${encoded}/preview`} />}
        >
          <Maximize2 />
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Export animation"
          render={<Link href={`/projects/${encoded}/export`} />}
        >
          <Scissors />
          Export
        </Button>
      </div>
    </div>
  );
}
