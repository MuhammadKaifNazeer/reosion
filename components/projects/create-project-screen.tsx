"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, SquarePlus, SquareKanban } from "lucide-react";

import { Logo, Wordmark } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStorage } from "@/lib/projects/storage";
import { DEFAULT_CODE } from "@/lib/projects/templates";
import {
  ASPECT_RATIO_PRESETS,
  type AspectRatio,
  type ProjectSettings,
  resolveDimensions,
} from "@/lib/types";

/**
 * Project creation. Aspect ratio is a PROJECT-LEVEL setting: chosen once here,
 * never asked again at export time.
 */
export function CreateProjectScreen() {
  const router = useRouter();
  const [name, setName] = useState("Untitled Animation");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  const [creating, setCreating] = useState(false);

  const previewDimensions = useMemo(() => {
    const width = Math.max(16, Number.parseInt(customWidth, 10) || 1920);
    const height = Math.max(16, Number.parseInt(customHeight, 10) || 1080);
    return resolveDimensions(ratio, width, height);
  }, [ratio, customWidth, customHeight]);

  async function create() {
    setCreating(true);
    try {
      const settings: ProjectSettings = {
        aspectRatio: ratio,
        width: previewDimensions.width,
        height: previewDimensions.height,
        fps: 30,
        duration: 3,
      };
      const project = await getStorage().createProject({
        name: name.trim() || "Untitled Animation",
        settings,
        code: DEFAULT_CODE,
      });
      router.push(`/projects/${project.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center gap-2">
        <Logo />
        <Wordmark />
        <span className="text-sm text-muted-foreground">/ New project</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft />
          Back to projects
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h1 className="text-base font-semibold tracking-tight">
              Create project
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              The animation is written in a single React file,{" "}
              <span className="font-mono text-foreground">Animation.tsx</span>.
            </p>
          </div>
          <div className="space-y-5 px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled Animation"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creating) void create();
                }}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aspect-ratio">Aspect ratio</Label>
              <Select
                value={ratio}
                onValueChange={(value) => setRatio(value as AspectRatio)}
              >
                <SelectTrigger id="aspect-ratio" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIO_PRESETS.map((preset) => (
                    <SelectItem key={preset.ratio} value={preset.ratio}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ratio === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="custom-width">Width (px)</Label>
                  <Input
                    id="custom-width"
                    inputMode="numeric"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-height">Height (px)</Label>
                  <Input
                    id="custom-height"
                    inputMode="numeric"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <Button className="w-full" onClick={() => void create()} disabled={creating}>
              {creating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <SquarePlus />
              )}
              Create Project
            </Button>
          </div>
        </div>

        <StagePreview
          width={previewDimensions.width}
          height={previewDimensions.height}
        />
      </div>
    </div>
  );
}

function StagePreview({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  // Fit the true dimensions into a bounded preview box so the frame keeps
  // the exact selected proportions: wide ratios grow wide, portrait ratios
  // grow tall — never clamped into a square.
  const BOX = 264;
  const scale = Math.min(BOX / width, BOX / height);
  return (
    <div className="flex w-full flex-col items-center rounded-lg border border-border bg-card p-4 md:w-80">
      <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded-md bg-accent/40">
        <div
          className="flex items-center justify-center rounded-sm bg-[#09090b] ring-1 ring-border/60"
          style={{
            width: Math.max(8, Math.round(width * scale)),
            height: Math.max(8, Math.round(height * scale)),
          }}
        >
          <SquareKanban className="size-5 text-muted-foreground/50" aria-hidden />
        </div>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
        Stage · {width} × {height} · 30fps
      </p>
    </div>
  );
}
