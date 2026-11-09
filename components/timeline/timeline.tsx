"use client";

import {
  useCallback,
  useSyncExternalStore,
} from "react";

import {
  AnimationClockController,
  formatTimecode,
} from "@/lib/clock/clock";
import { cn } from "@/lib/utils";

/**
 * Playback timeline: scrubbing and navigation only. There is deliberately no
 * layer/keyframe UI — the animation is the user's code; this strip exists to
 * see and move through time.
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

  const scrubTo = useCallback(
    (ratio: number) => {
      clock.pause();
      const next = Math.max(0, Math.min(1, ratio)) * duration;
      clock.seek(next);
    },
    [clock, duration],
  );

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    scrubTo((event.clientX - rect.left) / rect.width);
  };

  const seconds = Math.ceil(duration);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* ruler */}
      <div
        className="relative select-none"
        role="slider"
        aria-label="Animation time"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Number(time.toFixed(3))}
        aria-valuetext={formatTimecode(time, clock.fps)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) handlePointer(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            clock.stepFrames(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            clock.stepFrames(1);
          }
        }}
      >
        <div className="relative h-7 rounded-sm border border-border bg-card">
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
          <div className="absolute -top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-brand" />
        </div>
      </div>
    </div>
  );
}
