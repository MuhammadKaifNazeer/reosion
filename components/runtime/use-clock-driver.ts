"use client";

import { useEffect } from "react";

import type { AnimationClockController } from "@/lib/clock/clock";

/**
 * Drives the animation clock in real time while it is playing. The clock
 * controller stays framework-free; this hook is the only rAF loop in the
 * workspace (the preview iframe never ticks itself).
 */
export function useClockDriver(clock: AnimationClockController): void {
  useEffect(() => {
    let rafId = 0;
    let lastTime: number | null = null;

    const loop = (ts: number) => {
      if (!clock.playing) {
        rafId = 0;
        return;
      }
      if (lastTime === null) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      clock.tick(Math.min(dt, 0.25));
      if (clock.playing) {
        rafId = window.requestAnimationFrame(loop);
      } else {
        rafId = 0;
      }
    };

    const sync = () => {
      if (clock.playing && !rafId) {
        lastTime = null;
        rafId = window.requestAnimationFrame(loop);
      } else if (!clock.playing && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const unsubscribe = clock.subscribe(sync);
    sync();
    return () => {
      unsubscribe();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [clock]);
}
