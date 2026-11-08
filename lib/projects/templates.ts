/**
 * DefaultAnimation code and the runtime API contract for user code.
 *
 * The runtime exposes `@reosion/runtime` to user code with:
 *   - useTime():  the current clock time in seconds (deterministic)
 *   - useStage(): width/height/fps/duration of the project stage
 *   - clamp / lerp / range helpers
 */

import type { Project } from "@/lib/types";

export const RUNTIME_MODULE_NAME = "@reosion/runtime";

export const STAGE_FILE_NAME = "Animation.tsx";

export const DEFAULT_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();

  // Deterministic: everything derives from \`t\`, the clock time in seconds.
  const accent = {
    width: 120 + Math.sin(t * Math.PI) * 60,
    opacity: Math.min(1, t * 2),
  };

  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        background: "#09090b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: "#fafafa",
          letterSpacing: "-0.03em",
        }}
      >
        Hello, Motion
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: "circOut" }}
        style={{
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
          ...accent,
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        style={{ color: "#a1a1aa", fontSize: 24 }}
      >
        Written in React. Exported locally.
      </motion.p>
    </main>
  );
}
`;

/** Minimal, always-valid source used when a project needs a blank slate. */
export const BASE_CODE = `import { useTime, useStage } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();
  const { width, height } = useStage();

  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        background: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 10 + t * 10, height: 10 + t * 10, background: "#60a5fa", borderRadius: 999 }} />
    </main>
  );
}
`;

/**
 * Default project settings per aspect ratio when the user picks a preset.
 * Duration is 3s everywhere; fps 30.
 */
export function defaultSettingsFor(
  aspectRatio: "16:9" | "1:1" | "9:16" | "4:5" | "custom",
  width = 1920,
  height = 1080,
) {
  return {
    aspectRatio,
    width: width ?? 1920,
    height: height ?? 1080,
    fps: 30,
    duration: 3,
  };
}

/** Shape used by the AI workspace when it needs project context. */
export function summarizeProject(project: Project): string {
  return `Project: "${project.name}" · ${project.aspectRatio} (${project.width}x${project.height}) · ${project.fps}fps · ${project.duration}s`;
}
