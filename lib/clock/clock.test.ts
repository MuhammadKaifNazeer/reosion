import { describe, expect, it } from "vitest";
import {
  AnimationClockController,
  DEFAULT_FPS,
  formatTimecode,
  framesToSeconds,
  timeToFrame,
} from "@/lib/clock/clock";

describe("time/frame conversion", () => {
  it("converts frames to exact seconds", () => {
    expect(framesToSeconds(103, 30)).toBeCloseTo(103 / 30);
  });

  it("maps time to the enclosing whole frame", () => {
    expect(timeToFrame(0, 30, 10)).toBe(0);
    expect(timeToFrame(0.033, 30, 10)).toBe(0); // 1ms before frame 1
    expect(timeToFrame(103 / 30, 30, 10)).toBe(103);
    expect(timeToFrame(5, 30, 5)).toBe(149); // clamped to last frame
  });

  it("formats timecodes as mm:ss.ff", () => {
    expect(formatTimecode(0, 30)).toBe("00:00.00");
    expect(formatTimecode(103 / 30, 30)).toBe("00:03.13");
  });
});

describe("AnimationClockController", () => {
  it("starts stopped at zero", () => {
    const clock = new AnimationClockController(5, DEFAULT_FPS);
    expect(clock.time).toBe(0);
    expect(clock.playing).toBe(false);
    expect(clock.currentFrame).toBe(0);
  });

  it("ticks the time and loops", () => {
    const clock = new AnimationClockController(2, 30);
    clock.tick(0.5);
    expect(clock.time).toBeCloseTo(0.5);
    clock.tick(2);
    expect(clock.time).toBeCloseTo(0.5); // 0.5 + 2 -> loop to 0.5
    clock.tick(0);
    expect(clock.time).toBeCloseTo(0.5);
  });

  it("seek clamps to [0, duration]", () => {
    const clock = new AnimationClockController(1, 30);
    clock.seek(-1);
    expect(clock.time).toBe(0);
    clock.seek(10);
    expect(clock.time).toBe(1);
  });

  it("seeks frames and steps within [0, totalFrames-1]", () => {
    const clock = new AnimationClockController(30, DEFAULT_FPS);
    expect(clock.totalFrames).toBe(900);
    clock.seek(framesToSeconds(103, DEFAULT_FPS));
    expect(clock.currentFrame).toBe(103);
    clock.stepFrames(2);
    expect(clock.currentFrame).toBe(105);
    clock.stepFrames(-999);
    expect(clock.currentFrame).toBe(0);
  });

  it("play rewinds when at the end", () => {
    const clock = new AnimationClockController(1, 30);
    clock.seek(1);
    clock.play();
    expect(clock.time).toBe(0);
    expect(clock.playing).toBe(true);
  });

  it("notifies subscribers on changes and snapshots are stable between them", () => {
    const clock = new AnimationClockController(1, 30);
    let calls = 0;
    const firstSnapshot = clock.snapshot();
    const unsubscribe = clock.subscribe(() => calls++);
    clock.seek(0.5);
    expect(calls).toBe(1);
    expect(clock.snapshot()).not.toBe(firstSnapshot);
    const unchangedSnapshot = clock.snapshot();
    clock.snapshot();
    expect(clock.snapshot()).toBe(unchangedSnapshot);
    unsubscribe();
    clock.seek(0.32);
    expect(calls).toBe(1);
  });
});
