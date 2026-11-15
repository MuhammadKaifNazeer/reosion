/**
 * Core project domain types.
 *
 * Kept intentionally small. A project has one source file (`Animation.tsx`),
 * an aspect-ratio driven stage size, an fps and a duration. Everything else
 * (versions, AI conversations) is stored alongside via `ProjectStorage`.
 */

export type AspectRatio = "16:9" | "1:1" | "9:16" | "4:5" | "custom";

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  /** Stage width in px (portrait/landscape follows the ratio). */
  width: number;
  /** Stage height in px. */
  height: number;
  fps: number;
  /** Duration of the animation in seconds. */
  duration: number;
  /** Time (seconds) at which the animation's motion ends; defaults to duration. */
  endAt?: number;
  /** Full source code of Animation.tsx. */
  code: string;
  /** Data URL of a representative frame (generated locally). */
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  code: string;
  label?: string;
  createdAt: number;
}

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  duration: number;
}

/** Aspect ratio presets used during project creation. */
export const ASPECT_RATIO_PRESETS: Array<{
  ratio: AspectRatio;
  label: string;
  width: number;
  height: number;
}> = [
  { ratio: "16:9", label: "16:9 · Landscape", width: 1920, height: 1080 },
  { ratio: "1:1", label: "1:1 · Square", width: 1080, height: 1080 },
  { ratio: "9:16", label: "9:16 · Vertical", width: 1080, height: 1920 },
  { ratio: "4:5", label: "4:5 · Portrait", width: 1080, height: 1350 },
  { ratio: "custom", label: "Custom", width: 1920, height: 1080 },
];

export function resolveDimensions(
  ratio: AspectRatio,
  width: number,
  height: number,
): { width: number; height: number } {
  if (ratio !== "custom") {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.ratio === ratio);
    if (preset) return { width: preset.width, height: preset.height };
  }
  return { width, height };
}
