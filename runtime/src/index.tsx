/**
 * Reosion sandbox runtime.
 *
 * This bundle runs inside a fully sandboxed iframe (opaque origin) — the
 * ONLY channel to the parent application is `postMessage` (see
 * `lib/protocol/messages.ts`). It contains:
 *
 *  - the controlled dependency set exposed to user code
 *    (react, framer-motion, lucide-react, @reosion/runtime)
 *  - the deterministic animation clock. Time NEVER advances on its own:
 *    every repaint is driven by an exact timestamp `postMessage`ed from the
 *    parent (SET_TIME). Preview playback, scrubbing and frame-by-frame
 *    rendering all use this one code path — what you see is what you export.
 *  - frame capture (export pipeline)
 *
 * Built by `scripts/build-runtime.mjs` into `public/runtime.js` and executed
 * inside the iframe by the /sandbox bootstrap document.
 */

import * as React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as FramerMotion from "framer-motion";
import * as LucideIcons from "lucide-react";
import { toPng } from "html-to-image";

import type {
  ParentMessage,
  RuntimeMessage,
  ProtocolError,
} from "../../lib/protocol/messages";

// ---------------------------------------------------------------------------
// Controlled dependency set
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __reosionDeps: Record<string, unknown>;
}

interface Stage {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

let stage: Stage = { width: 1920, height: 1080, fps: 30, duration: 3 };

// Runtime API exposed to user code as `@reosion/runtime`.
const timeListeners = new Set<(time: number) => void>();
let displayedTime = 0;

function useTime(): number {
  const [, force] = React.useReducer((c: number) => c + 1, 0);
  React.useEffect(() => {
    const listener = () => force();
    timeListeners.add(listener);
    // ensure a value the component can render with on mount
    listener();
    return () => {
      timeListeners.delete(listener);
    };
  }, []);
  return displayedTime;
}

function useStage(): Stage {
  return stage;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const runtimeApi = { useTime, useStage, clamp, lerp };

globalThis.__reosionDeps = Object.freeze({
  react: React,
  "react/jsx-runtime": ReactJsxRuntime,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOMClient,
  "framer-motion": FramerMotion,
  "lucide-react": LucideIcons,
  "@reosion/runtime": runtimeApi,
});

// ---------------------------------------------------------------------------
// Deterministic clock
//
// `requestAnimationFrame` is hijacked: every scheduled callback lands in our
// queue and runs ONLY when a parent timestamp arrives. The rendered world is
// therefore always located at an exact animation frame.
//
// On a backward seek the React tree is remounted with a new key and replayed
// frame-by-frame: framer-motion animations integrate forward from t=0, so
// seeking to frame 85 shows precisely the state at frame 85.
// ---------------------------------------------------------------------------

const queue = new Map<number, (ts: number) => void>();
let nextHandle = 1;
let logicalMs = 0;
let remountKey = 0;
let inflightSeek: Promise<void> = Promise.resolve();

const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);

window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
  queue.set(nextHandle, cb as (ts: number) => void);
  return nextHandle++;
}) as typeof window.requestAnimationFrame;

window.cancelAnimationFrame = ((handle: number) => {
  queue.delete(handle);
}) as typeof window.cancelAnimationFrame;

// Framer-motion and user code read elapsed time through performance.now().
// Under the rigged clock it always equals the current animation time.
window.performance.now = () => logicalMs;

function pump(ts: number): void {
  logicalMs = ts;
  const callbacks = Array.from(queue.values());
  queue.clear();
  for (const cb of callbacks) {
    try {
      cb(ts);
    } catch (error) {
      reportError("RENDER_ERROR", error);
    }
  }
}

function microflush(): Promise<void> {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  queueMicrotask(() => resolve());
  return promise;
}

async function settle(startMs: number, targetMs: number): Promise<void> {
  const fnsPerSecond = stage.fps;
  const span = Math.max(0, targetMs - startMs);
  const exactSteps = Math.ceil((span / 1000) * fnsPerSecond);
  const steps = Math.max(1, Math.min(exactSteps, 10000));
  for (let step = 1; step <= steps; step++) {
    const t = startMs + ((targetMs - startMs) * step) / steps;
    pump(t);
    await microflush();
  }
}

/**
 * Moves the world to exactly `time` seconds. Pass `remount` to replay the
 * whole animation forward from zero (required for backward seeks).
 */
function applyTime(time: number, remount: boolean): Promise<void> {
  const targetMs = Math.round(time * stage.fps) * (1000 / stage.fps);
  if (remount) remountKey++;
  const startMs = remount ? 0 : Math.max(0, logicalMs);
  if (targetMs === startMs) {
    notifyTime(targetMs / 1000);
    renderScene();
    return Promise.resolve();
  }
  displayedTime = targetMs / 1000;
  const run = (async () => {
    await settle(startMs, targetMs);
    notifyTime(displayedTime);
  })();
  run.catch((error) => reportError("RUNTIME_ERROR", error));
  return run;
}

function notifyTime(time: number): void {
  displayedTime = time;
  for (const listener of Array.from(timeListeners)) {
    listener(time);
  }
}

// ---------------------------------------------------------------------------
// React rendering
// ---------------------------------------------------------------------------

const stageEl = document.getElementById("stage")!;
const root = ReactDOMClient.createRoot(stageEl);

type UserModule = { default: React.ComponentType };
let userComponent: React.ComponentType | null = null;

function reportError(target: "RUNTIME_ERROR" | "RENDER_ERROR", e: unknown) {
  const error = toProtocolErrorLocal(e);
  post({ type: target, error });
}

function toProtocolErrorLocal(e: unknown): ProtocolError {
  if (e instanceof Error) {
    return { message: e.message || "Unknown error", stack: e.stack };
  }
  return { message: typeof e === "string" ? e : "Unknown error" };
}

class ErrorBoundary extends React.Component<{
  onError: (e: unknown) => void;
  children: React.ReactNode;
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.props.children;
  }
}

function renderScene() {
  if (!userComponent) return;
  const key = String(remountKey);
  root.render(
    <ErrorBoundary key={key} onError={(e) => reportError("RENDER_ERROR", e)}>
      <StageSurface />
    </ErrorBoundary>,
  );
}

/**
 * Props surface for user code: fixed pixel size matching the project stage;
 * user renders height:100% by convention.
 */
function StageSurface() {
  return (
    <div
      style={{ width: stage.width, height: stage.height }}
      key={remountKey}
      data-reosion-stage="1"
    >
      <ErrorBoundary onError={(e) => reportError("RENDER_ERROR", e)}>
        {userComponent ? React.createElement(userComponent) : null}
      </ErrorBoundary>
    </div>
  );
}

async function evalModule(code: string): Promise<UserModule> {
  const blobURL = URL.createObjectURL(
    new Blob([code], { type: "text/javascript" }),
  );
  try {
    return (await import(/* webpackIgnore: true */ blobURL)) as UserModule;
  } finally {
    URL.revokeObjectURL(blobURL);
  }
}

async function loadCode(code: string): Promise<void> {
  remountKey++;
  // The CSS cache must be rebuilt: new user code can introduce new Tailwind
  // classes and therefore new stylesheet rules.
  cachedCSS = null;
  let component: React.ComponentType | null = null;
  try {
    const mod = await evalModule(code);
    const def = (mod as UserModule).default;
    if (typeof def !== "function") {
      reportError("RUNTIME_ERROR", new Error(
        "Animation.tsx must export a default React component (export default function Animation() { ... })",
      ));
      return;
    }
    component = def;
  } catch (error) {
    reportError("RUNTIME_ERROR", error);
    return;
  }
  userComponent = component;
  notifyTime(0);
  renderScene();
}

// ---------------------------------------------------------------------------
// Frame capture (export pipeline)
//
// The stage is rasterized with a lean SVG foreignObject pipeline:
//   1. the sandbox document's CSS is serialized once and cached across frames
//   2. each frame clones the stage DOM, inlines pseudo-element content, and
//      rasterizes the SVG image into an OffscreenCanvas
//   3. pixels are handed to the parent as a transferable ImageBitmap — no PNG
//      encode, no data URL round-trip
//
// `toPng` (html-to-image) is kept strictly as a fallback for stages the lean
// pipeline cannot handle (e.g. external images, which foreignObject images
// are not allowed to fetch).
// ---------------------------------------------------------------------------

// Serialized CSS of the sandbox document, cached across frames. Rebuilt after
// every LOAD_CODE and whenever the stylesheet rule count changes (Tailwind's
// browser runtime appends rules lazily as new classes appear).
let cachedCSS: string | null = null;
let cachedCSSRuleCount = -1;

function collectCSS(): string {
  let ruleCount = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      ruleCount += sheet.cssRules.length;
    } catch {
      // Foreign-origin sheets cannot be read; the sandbox has none.
    }
  }
  if (cachedCSS !== null && ruleCount === cachedCSSRuleCount) return cachedCSS;
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += `${rule.cssText}\n`;
    } catch {
      // Ignore unreadable sheets.
    }
  }
  cachedCSS = css;
  cachedCSSRuleCount = ruleCount;
  return css;
}

function hasPseudoContent(el: Element, pseudo: ":before" | ":after"): boolean {
  const content = getComputedStyle(el, pseudo).content;
  return !!content && content !== "none" && content !== "normal";
}

/**
 * Materializes ::before/::after content as real child spans (html-to-image's
 * approach) so the serialized XML clone renders them. Computed styles of the
 * pseudo element are copied onto the span; `content` is rendered as text
 * because the `content` property has no effect on real elements.
 */
function inlinePseudoElements(source: Element, clone: Element): void {
  if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) return;

  const children = source.children;
  const cloneChildren = clone.children;
  if (children.length !== cloneChildren.length) return;
  for (let i = 0; i < children.length; i++) {
    inlinePseudoElements(children[i], cloneChildren[i]);
  }

  if (hasPseudoContent(source, ":before")) {
    const style = getComputedStyle(source, ":before");
    const span = document.createElement("span");
    span.style.cssText = style.cssText;
    span.textContent = style.content.replace(/^["']|["']$/g, "");
    clone.insertBefore(span, clone.firstChild);
  }
  if (hasPseudoContent(source, ":after")) {
    const style = getComputedStyle(source, ":after");
    const span = document.createElement("span");
    span.style.cssText = style.cssText;
    span.textContent = style.content.replace(/^["']|["']$/g, "");
    clone.appendChild(span);
  }
}

/** True when the stage embeds images foreignObject rasterization can't fetch. */
function stageHasExternalImages(): boolean {
  return Array.from(stageEl.querySelectorAll("img")).some((img) => {
    const src = img.getAttribute("src") ?? "";
    return !!src && !src.startsWith("data:") && !src.startsWith("blob:");
  });
}

function buildStageSvg(): string {
  const css = collectCSS().replace(/<\/(style)/gi, "<\\/$1");
  const clone = stageEl.cloneNode(true) as Element;
  inlinePseudoElements(stageEl, clone);
  const inner = new XMLSerializer().serializeToString(clone);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${stage.width}" height="${stage.height}">` +
    `<style>${css}</style>` +
    `<foreignObject width="100%" height="100%">${inner}</foreignObject>` +
    `</svg>`
  );
}

function loadImageFromSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("stage rasterization failed"));
    // A data: URL (not a blob: URL) is required: images loaded from blob
    // URLs taint canvases in opaque-origin (sandboxed) documents, which
    // makes the produced ImageBitmap impossible to transfer. data: URLs
    // keep the canvas origin-clean.
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const supportsBitmapCapture =
  typeof OffscreenCanvas !== "undefined" &&
  typeof createImageBitmap === "function" &&
  typeof XMLSerializer !== "undefined";

async function captureFrame(frameId: number): Promise<void> {
  const t0 = Date.now();

  if (supportsBitmapCapture && !stageHasExternalImages()) {
    try {
      const img = await loadImageFromSvg(buildStageSvg());
      const canvas = new OffscreenCanvas(stage.width, stage.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2d context unavailable");
      ctx.drawImage(img, 0, 0, stage.width, stage.height);
      const bitmap = await createImageBitmap(canvas);
      post(
        {
          type: "FRAME",
          frameId,
          width: stage.width,
          height: stage.height,
          bitmap,
          captureMs: Date.now() - t0,
        },
        [bitmap],
      );
      return;
    } catch (error) {
      console.error("[runtime] fast capture failed; falling back to toPng", error);
    }
  }

  // Fallback: html-to-image (handles external images via inlining).
  const prevRAF = window.requestAnimationFrame;
  const prevCancel = window.cancelAnimationFrame;
  window.requestAnimationFrame = nativeRequestAnimationFrame;
  window.cancelAnimationFrame = nativeCancelAnimationFrame;
  try {
    const dataURL = await Promise.race([
      toPng(stageEl, {
        width: stage.width,
        height: stage.height,
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("toPng timed out")), 10000),
      ),
    ]);
    post({
      type: "FRAME",
      frameId,
      dataURL,
      width: stage.width,
      height: stage.height,
      captureMs: Date.now() - t0,
    });
  } catch (error) {
    console.error("[runtime] capture failed", error);
    reportError("RUNTIME_ERROR", new Error(
      `Frame capture failed: ${error instanceof Error ? error.message : String(error)}`,
    ));
  } finally {
    window.requestAnimationFrame = prevRAF;
    window.cancelAnimationFrame = prevCancel;
  }
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

function post(message: RuntimeMessage, transfer?: Transferable[]): void {
  window.parent?.postMessage(message, "*", transfer ?? []);
}

function handle(message: ParentMessage): void {
  switch (message.type) {
    case "LOAD_CODE": {
      stage = {
        width: message.stage?.width ?? 1920,
        height: message.stage?.height ?? 1080,
        fps: message.stage?.fps ?? 30,
        duration: message.stage?.duration ?? 3,
      };
      inflightSeek = (async () => {
        await inflightSeek;
        await loadCode(message.code);
        if (message.time !== undefined) {
          await applyTime(message.time, true);
        } else {
          await applyTime(0, true);
        }
      })();
      break;
    }
    case "SET_TIME": {
      inflightSeek = (async () => {
        await inflightSeek;
        // backward => replay forward from zero for exact framer-motion state
        const remount = message.time < displayedTime - 1e-6;
        await applyTime(message.time, remount);
      })();
      break;
    }
    case "SEEK": {
      inflightSeek = (async () => {
        await inflightSeek;
        await applyTime(message.time, true);
      })();
      break;
    }
    case "PLAY": {
      inflightSeek = (async () => {
        await inflightSeek;
        if (message.from !== undefined) {
          await applyTime(message.from, true);
        }
      })();
      break;
    }
    case "PAUSE": {
      // The clock simply stops being advanced by the parent.
      break;
    }
    case "RESIZE": {
      // Stage size is project-fixed; the parent handles visual scaling.
      break;
    }
    case "RESET": {
      remountKey++;
      renderScene();
      break;
    }
    case "CAPTURE_FRAME": {
      // Chain behind pending seeks so a capture always happens after the
      // queued SET_TIME has fully settled (exact frame painted).
      inflightSeek = (async () => {
        await inflightSeek;
        await microflush();
        await captureFrame(message.frameId);
      })();
      break;
    }
  }
}

window.addEventListener("message", (event: MessageEvent) => {
  // The iframe is a fresh opaque-origin document; validate the source and
  // message shape before acting.
  if (event.source !== window.parent) return;
  const data = event.data as { type?: string; sources?: unknown[] };
  if (typeof data !== "object" || data === null) return;

  if (data.type === "EXECUTE") {
    for (const source of data.sources as string[]) {
      // Bootstrap only ever receives the bundle built by
      // scripts/build-runtime.mjs from this repository's source.
      // eslint-disable-next-line no-eval
      (0, eval)(source);
    }
    return;
  }

  const PARENT_TYPES = [
    "LOAD_CODE",
    "SET_TIME",
    "PLAY",
    "PAUSE",
    "SEEK",
    "RESIZE",
    "RESET",
    "CAPTURE_FRAME",
  ];
  if (typeof data.type === "string" && PARENT_TYPES.includes(data.type)) {
    handle(data as ParentMessage);
  }
});

// Runtime bundle installed: announce readiness, then park on an empty scene
// until the parent compiles and loads user code.
post({ type: "READY" });
renderScene();
