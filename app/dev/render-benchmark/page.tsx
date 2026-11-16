"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Beaker, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BENCHMARK_CASES,
  createBenchmarkProject,
} from "@/lib/export/benchmark";

/**
 * Development-only render benchmark. Creates a throwaway project per case
 * and opens its export screen (autostarted). Stage timings are logged to the
 * console as `[reosion:export] …` and shown on the result panel.
 */
export default function RenderBenchmarkPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string) => {
    const benchmarkCase = BENCHMARK_CASES.find((c) => c.id === id);
    if (!benchmarkCase) return;
    setBusy(id);
    try {
      const projectId = await createBenchmarkProject(benchmarkCase);
      router.push(`/projects/${projectId}/export?autostart=1`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2">
          <Beaker className="size-4 text-muted-foreground" aria-hidden />
          <h1 className="text-sm font-medium text-foreground">
            Reosion render benchmark
          </h1>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dev-only. Each case creates a throwaway project and runs the real
          export pipeline. Watch the console for{" "}
          <code className="font-mono text-[10px]">[reosion:export]</code> stage
          timings; the result panel shows the summary.
        </p>
        <div className="mt-4 space-y-2">
          {BENCHMARK_CASES.map((benchmarkCase) => (
            <Button
              key={benchmarkCase.id}
              variant="outline"
              className="w-full justify-between"
              disabled={busy !== null}
              onClick={() => void run(benchmarkCase.id)}
            >
              <span className="font-mono text-[10px]">{benchmarkCase.label}</span>
              <Play />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
