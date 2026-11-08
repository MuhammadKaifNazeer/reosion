/**
 * Typed postMessage protocol between the Next.js application (parent) and the
 * sandboxed preview runtime (iframe).
 *
 * The sandbox runs user animation code with an opaque origin — the ONLY
 * channel between the two worlds is `postMessage`. Both sides must validate
 * messages against these shapes; nothing else crosses the boundary.
 */

export interface ProtocolError {
  message: string;
  stack?: string;
  line?: number;
  column?: number;
}

// ---------------------------------------------------------------------------
// Parent -> Runtime
// ---------------------------------------------------------------------------

/** Load (or reload) user code into the runtime. */
export interface LoadCodeMessage {
  type: "LOAD_CODE";
  /** Compiled module source produced by the local compiler. */
  code: string;
  /** True when the runtime should present itself at t=0 and pause. */
  paused: boolean;
  /** Time to seek to after load (seconds). */
  time?: number;
}

/** Set the deterministic clock. */
export interface SetTimeMessage {
  type: "SET_TIME";
  time: number;
}

/** Start driving the clock in real time from the given position (default 0). */
export interface PlayMessage {
  type: "PLAY";
  from?: number;
}

/** Stop the clock and freeze the scene at the current time. */
export interface PauseMessage {
  type: "PAUSE";
}

/** Seek to an exact timestamp without changing play state. */
export interface SeekMessage {
  type: "SEEK";
  time: number;
}

/** Notify the runtime that the iframe resized (CSS only, stage size is fixed). */
export interface ResizeMessage {
  type: "RESIZE";
  width: number;
  height: number;
}

/** Hard reload of the animation module (remount everything). */
export interface ResetMessage {
  type: "RESET";
}

/**
 * Ask the runtime to capture the stage as an image and report it back.
 * Used by the local renderer; `frameId` is echoed in FRAME responses.
 */
export interface CaptureFrameMessage {
  type: "CAPTURE_FRAME";
  frameId: number;
}

// Union in load order.
export type ParentMessage =
  | LoadCodeMessage
  | SetTimeMessage
  | PlayMessage
  | PauseMessage
  | SeekMessage
  | ResizeMessage
  | ResetMessage
  | CaptureFrameMessage;

// ---------------------------------------------------------------------------
// Runtime -> Parent
// ---------------------------------------------------------------------------

/** Signals the runtime bundle finished installing (scripts executed). */
export interface ReadyMessage {
  type: "READY";
}

/** The compiled code failed in the runtime (eval/import/exec errors). */
export interface RuntimeErrorErrorMessage {
  type: "RUNTIME_ERROR";
  error: ProtocolError;
}

/** React render threw while painting the animation. */
export interface RenderErrorMessage {
  type: "RENDER_ERROR";
  error: ProtocolError;
}

/** Runtime reports the animation duration it was told (if any). */
export interface DurationMessage {
  type: "DURATION";
  duration: number;
}

/** One captured frame of the stage (export pipeline). */
export interface FrameMessage {
  type: "FRAME";
  frameId: number;
  /** PNG data URL of the stage. */
  dataURL: string;
  width: number;
  height: number;
}

/** Runtime echoes clock moves so the parent can stay in sync when needed. */
export interface TimeMessage {
  type: "TIME";
  time: number;
}

export type RuntimeMessage =
  | ReadyMessage
  | RuntimeErrorErrorMessage
  | RenderErrorMessage
  | DurationMessage
  | FrameMessage
  | TimeMessage;

// ---------------------------------------------------------------------------
// Narrowing helpers so both sides can validate untrusted messages
// ---------------------------------------------------------------------------

export function isParentMessage(value: unknown): value is ParentMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const type = (value as { type: string }).type;
  return [
    "LOAD_CODE",
    "SET_TIME",
    "PLAY",
    "PAUSE",
    "SEEK",
    "RESIZE",
    "RESET",
    "CAPTURE_FRAME",
  ].includes(type);
}

export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const type = (value as { type: string }).type;
  return [
    "READY",
    "RUNTIME_ERROR",
    "RENDER_ERROR",
    "DURATION",
    "FRAME",
    "TIME",
  ].includes(type);
}

export function toProtocolError(e: unknown): ProtocolError {
  if (e instanceof Error) {
    return { message: e.message || "Unknown error", stack: e.stack };
  }
  return { message: typeof e === "string" ? e : "Unknown error" };
}
