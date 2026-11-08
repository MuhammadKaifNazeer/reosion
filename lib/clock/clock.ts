/**
 * Deterministic animation clock.
 *
 * Time is the source of truth, never wall-time division. Given `fps` and
 * `duration`:
 *
 *   time (seconds)  = frame / fps
 *   frame           = floor(time * fps)      (whole rendered frames)
 *
 * The preview plays in real time, but each rendered frame is an exact
 * timestamp on the clock, so what you scrub is what you export.
 */

export const DEFAULT_FPS = 30;

export function framesToSeconds(frame: number, fps: number): number {
  return frame / fps;
}

/** Whole frame index for a given time (clamped at duration end). */
export function timeToFrame(time: number, fps: number, duration: number): number {
  const max = Math.max(0, Math.floor(duration * fps - 1e-6));
  return Math.max(0, Math.min(max, Math.floor(time * fps + 1e-6)));
}

/** Formats seconds as `mm:ss.ff` (frame) — used by controls and timeline. */
export function formatTimecode(time: number, fps: number): string {
  const clamped = Math.max(0, time);
  const wholeFrames = timeToFrame(clamped, fps, Number.MAX_SAFE_INTEGER);
  const totalSeconds = Math.floor(wholeFrames / fps);
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  const frames = wholeFrames % fps;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(frames).padStart(2, "0")}`;
}

export interface ClockSnapshot {
  time: number;
  duration: number;
  fps: number;
  playing: boolean;
}

export interface AnimationClock {
  /** Current time in seconds (unquantized; frame index is derived as needed). */
  readonly time: number;
  readonly duration: number;
  readonly fps: number;
  readonly playing: boolean;
  readonly totalFrames: number;
  readonly currentFrame: number;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(time: number): void;
  stepFrames(delta: number): void;
  /** Advance by `deltaSeconds`; returns whether the position changed. */
  tick(deltaSeconds: number): boolean;
  snapshot(): ClockSnapshot;
  subscribe(listener: () => void): () => void;
}

type ClockState = ClockSnapshot;

/**
 * A framework-free clock controller. UI subscribes via `subscribe()` /
 * `useSyncExternalStore` so playhead updates never re-render unrelated UI.
 *
 * It owns no timers: the active driver (rAF playback loop in the page, or the
 * renderer stepping frames) calls `tick()` / `seek()`.
 */
export class AnimationClockController implements AnimationClock {
  private listeners = new Set<() => void>();
  private state: ClockState;

  constructor(
    readonly duration: number,
    readonly fps: number,
  ) {
    this.state = { time: 0, duration, fps, playing: false };
  }

  get time(): number {
    return this.state.time;
  }

  get playing(): boolean {
    return this.state.playing;
  }

  get totalFrames(): number {
    return Math.max(0, Math.round(this.duration * this.fps));
  }

  get currentFrame(): number {
    return timeToFrame(this.time, this.fps, this.duration);
  }

  private update(partial: Partial<ClockState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) listener();
  }

  play(): void {
    if (this.state.playing) return;
    if (this.state.time >= this.duration - 1e-6) {
      this.update({ time: 0, playing: true });
    } else {
      this.update({ playing: true });
    }
  }

  pause(): void {
    if (!this.state.playing) return;
    this.update({ playing: false });
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(this.duration, time));
    this.update({ time: clamped });
  }

  stepFrames(delta: number): void {
    const fps = this.fps;
    const next = this.currentFrame + delta;
    const max = Math.max(0, this.totalFrames - 1);
    const frame = Math.max(0, Math.min(max, next));
    this.seek(framesToSeconds(frame, fps));
  }

  tick(deltaSeconds: number): boolean {
    let next = this.state.time + deltaSeconds;
    // Loop playback; the play/pause state is untouched by tick().
    if (next >= this.duration) {
      next = next % this.duration;
    }
    this.update({ time: next });
    return deltaSeconds !== 0 || this.state.playing;
  }

  snapshot(): ClockSnapshot {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/** React-friendly hook wiring for the controller lives in the app; this is pure. */
export function isAtEnd(clock: AnimationClock, epsilon = 1e-6): boolean {
  return clock.time >= clock.duration - epsilon;
}
