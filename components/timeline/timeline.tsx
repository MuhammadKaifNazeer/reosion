"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  AnimationClockController,
  formatTimecode,
} from "@/lib/clock/clock";
import { cn } from "@/lib/utils";

/**
 * Playback timeline: scrubbing and navigation only. There is deliberately no
 * layer/keyframe UI — the animation is the user's code; this strip exists to
 * see and move through time.
 *
 * Seeking drives the shared animation clock directly, so the preview (via
 * SET_TIME) and the transport are always in sync. Scrubbing pauses playback
 * and resumes it after the drag ends.
 */
export function Timeline({
  clock,
  className,
}: {
  clock: AnimationClockController;
  className?: string;
}) {
  const snapshot = useSyncExternalStore(
    clock.subscribe.bind(clock),
    clock.snapshot.bind(clock),
  );
  const time = snapshot.time;
  const duration = snapshot.duration;
  const progress = duration > 0 ? time / duration : 0;
  const wasPlaying = useCallback(
    (el: HTMLElement) => el.dataset.wasPlaying === "1",
    [],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      const next = Math.max(0, Math.min(1, ratio)) * clock.duration;
      clock.seek(next);
    },
    [clock],
  );

  const ratioFromEvent = (
    event: React.PointerEvent<HTMLDivElement>,
  ): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return (event.clientX - rect.left) / rect.width;
  };

  const seconds = Math.ceil(duration);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className="relative h-7 cursor-ew-resize touch-none select-none"
        role="slider"
        aria-label="Animation time"
        aria-valuemin={0}
        aria-valuemax={Number(duration.toFixed(3))}
        aria-valuenow={Number(time.toFixed(3))}
        aria-valuetext={formatTimecode(time, clock.fps)}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0 || duration <= 0) return;
          // Scrub pauses playback; remember so release can resume it.
          e.currentTarget.dataset.wasPlaying = clock.playing ? "1" : "0";
          clock.pause();
          e.currentTarget.setPointerCapture(e.pointerId);
          seekToRatio(ratioFromEvent(e));
        }}
        onPointerMove={(e) => {
          if (
            e.buttons & 1 &&
            e.currentTarget.hasPointerCapture(e.pointerId)
          ) {
            seekToRatio(ratioFromEvent(e));
          }
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (wasPlaying(e.currentTarget)) {
              clock.play();
            }
            delete e.currentTarget.dataset.wasPlaying;
          }
        }}
        onPointerCancel={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            delete e.currentTarget.dataset.wasPlaying;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            clock.stepFrames(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            clock.stepFrames(1);
          } else if (e.key === "Home") {
            e.preventDefault();
            clock.seek(0);
          } else if (e.key === "End") {
            e.preventDefault();
            clock.seek(clock.duration);
          }
        }}
      >
        <div className="relative h-7 overflow-hidden rounded-sm border border-border bg-card transition-colors hover:bg-accent/30">
          {/* minor ticks: 10 per second */}
          {Array.from({ length: seconds * 10 + 1 }).map((_, i) => {
            const isMajor = i % 10 === 0;
            const left = duration > 0 ? (i / 10 / duration) * 100 : 0;
            return (
              <span
                key={i}
                aria-hidden
                className="absolute top-0 w-px bg-border"
                style={{
                  left: `${left}%`,
                  height: isMajor ? "10px" : "5px",
                  top: isMajor ? 0 : "5px",
                }}
              />
            );
          })}
          {/* elapsed region */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-brand/10"
            style={{ width: `${progress * 100}%` }}
          />
          {/* second labels */}
          {Array.from({ length: seconds + 1 }).map((_, i) => (
            <span
              key={`label-${i}`}
              aria-hidden
              className="absolute top-2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground"
              style={{ left: `${duration > 0 ? (i / duration) * 100 : 0}%` }}
            >
              {i}s
            </span>
          ))}
        </div>

        {/* playhead */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-[-6px] z-10"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="h-full w-px bg-brand" />
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-brand" />
        </div>
      </div>
    </div>
  );
}
