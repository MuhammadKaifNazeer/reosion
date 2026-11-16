/**
 * Development-only render benchmark cases.
 *
 * Each case is a deterministic, self-contained animation rendered through
 * the real export pipeline (sandbox runtime → capture → encode). The export
 * screen logs structured stage timings to the console
 * (`[reosion:export] …`) and shows a summary on the result panel.
 *
 * Progression: static DOM → Framer Motion → full-resolution static.
 * Nothing here ships to production UI; the route lives under /dev.
 */
import { getStorage } from "@/lib/projects/storage";
import type { ProjectSettings } from "@/lib/types";

export interface BenchmarkCase {
  id: string;
  label: string;
  settings: ProjectSettings;
  code: string;
}

const STATIC_CODE = `export default function Animation() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Reosion
      </div>
    </div>
  );
}
`;

const FRAMER_CODE = `import { motion } from "framer-motion";

export default function Animation() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Reosion
      </motion.div>
    </div>
  );
}
`;

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: "static-low",
    label: "Static · 320×180 · 10fps · 1s (10 frames)",
    settings: {
      aspectRatio: "custom",
      width: 320,
      height: 180,
      fps: 10,
      duration: 1,
    },
    code: STATIC_CODE,
  },
  {
    id: "static-mid",
    label: "Static · 640×360 · 30fps · 2s (60 frames)",
    settings: {
      aspectRatio: "custom",
      width: 640,
      height: 360,
      fps: 30,
      duration: 2,
    },
    code: STATIC_CODE,
  },
  {
    id: "framer-mid",
    label: "Framer Motion · 640×360 · 30fps · 2s (60 frames)",
    settings: {
      aspectRatio: "custom",
      width: 640,
      height: 360,
      fps: 30,
      duration: 2,
    },
    code: FRAMER_CODE,
  },
  {
    id: "static-full",
    label: "Static · 1920×1080 · 30fps · 2s (60 frames)",
    settings: {
      aspectRatio: "custom",
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 2,
    },
    code: STATIC_CODE,
  },
];

/** Creates a throwaway project for a benchmark case and returns its id. */
export async function createBenchmarkProject(
  benchmarkCase: BenchmarkCase,
): Promise<string> {
  const project = await getStorage().createProject({
    name: `Benchmark · ${benchmarkCase.id}`,
    settings: benchmarkCase.settings,
    code: benchmarkCase.code,
  });
  return project.id;
}
