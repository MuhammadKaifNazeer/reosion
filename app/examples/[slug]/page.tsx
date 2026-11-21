"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/timeline/timeline";
import { PreviewRuntime } from "@/components/runtime/preview-runtime";
import { StageFitter } from "@/components/runtime/stage-fitter";
import { TransportControls } from "@/components/runtime/transport-controls";
import { useClockDriver } from "@/components/runtime/use-clock-driver";
import { AnimationClockController } from "@/lib/clock/clock";
import { getStorage } from "@/lib/projects/storage";
import { findExample, exampleToProject } from "@/lib/examples";
import type { Project } from "@/lib/types";

import { Suspense } from "react";

function ExampleViewer() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const example = findExample(params.slug);
  const [project, setProject] = useState<Project | null>(null);
  const [clock, setClock] = useState<AnimationClockController | null>(null);
  const [remixing, setRemixing] = useState(false);

  useEffect(() => {
    if (!example) return;
    const p = exampleToProject(example);
    setProject(p);
    setClock(new AnimationClockController(p.duration, p.fps));
  }, [example]);

  useClockDriver(clock ?? new AnimationClockController(1, 30));

  async function remix() {
    if (!example) return;
    setRemixing(true);
    try {
      const created = await getStorage().createProject({
        name: example.title,
        settings: {
          aspectRatio: "16:9",
          width: example.width,
          height: example.height,
          fps: example.fps,
          duration: example.duration,
        },
        code: example.code,
      });
      router.push("/projects/" + created.id);
    } finally {
      setRemixing(false);
    }
  }

  if (!example) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Example not found.</p>
      </div>
    );
  }

  if (!project || !clock) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <span className="font-mono text-xs">Loading example…</span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Button variant="ghost" size="sm" render={<a href="/examples" />}>
          <ArrowLeft />
          Examples
        </Button>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{example.title}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {example.width}×{example.height} · {example.fps}fps · {example.duration}s
          </p>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={remix} disabled={remixing}>
            <Scissors />
            {remixing ? "Creating…" : "Remix"}
          </Button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#09090b]">
        <StageFitter width={project.width} height={project.height}>
          {(scale) => (
            <div
              className="relative overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/15"
              style={{ width: Math.round(project.width * scale), height: Math.round(project.height * scale) }}
            >
              <div style={{ width: project.width, height: project.height, transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
                <PreviewRuntime project={project} clock={clock} />
              </div>
            </div>
          )}
        </StageFitter>
      </div>
      <div className="shrink-0 border-t border-border px-3 py-2">
        <Timeline clock={clock} />
      </div>
      <div className="flex items-center justify-center border-t border-border py-2">
        <TransportControls project={project} clock={clock} projectId="example" />
      </div>
    </div>
  );
}

export default function ExamplePage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground"><span className="font-mono text-xs">Loading example…</span></div>}>
      <ExampleViewer />
    </Suspense>
  );
}