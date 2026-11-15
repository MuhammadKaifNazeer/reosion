"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  Code2,
  Loader2,
  Save,
  Scissors,
  Settings,
  Sparkles,
  WrapText,
  AlignLeft,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeEditorPane } from "@/components/editor/code-editor-pane";
import { AIWorkspace } from "@/components/editor/ai-workspace";
import { PreviewRuntime } from "@/components/runtime/preview-runtime";
import { StageFitter } from "@/components/runtime/stage-fitter";
import { downscaleDataURL } from "@/lib/thumbnails/downscale";
import type {
  CompileStatus,
  RuntimeStatus,
} from "@/components/runtime/preview-runtime";
import { TransportControls } from "@/components/runtime/transport-controls";
import { useClockDriver } from "@/components/runtime/use-clock-driver";
import { Timeline } from "@/components/timeline/timeline";
import { AnimationClockController } from "@/lib/clock/clock";
import { getStorage } from "@/lib/projects/storage";
import { STAGE_FILE_NAME } from "@/lib/projects/templates";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/** sessionStorage key for the editor/preview split position. */
const SPLIT_KEY = "reosion:split";

/**
 * The project workspace.
 *
 *   ┌────────────────────────────────────────────────────┐
 *   │ header                                             │
 *   ├──┬──────────────────────────────┬──────────────────┤
 *   │r │ code / ai                    │ preview          │
 *   │a ├──────────────────────────────┤                  │
 *   │i │                              ├──────────────────┤
 *   │l │                              │ timeline         │
 *   └──┴──────────────────────────────┴──────────────────┘
 *
 * The clock lives in a controller (never in a global store); only the
 * transport + timeline subscribe to it.
 */
export function WorkspaceScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"code" | "ai">("code");
  const [compileStatus, setCompileStatus] = useState<CompileStatus>({
    kind: "idle",
  });
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({
    kind: "booting",
  });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved",
  );
  const [captureRequested, setCaptureRequested] = useState(false);
  const [errorFocus, setErrorFocus] = useState<{
    line: number;
    column: number;
    token: number;
  } | null>(null);
  // Split position persists for the browser session (survives reloads and
  // navigation within the tab, not across browser restarts).
  const [wordWrap, setWordWrap] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [draftDuration, setDraftDuration] = useState("");
  const [draftFps, setDraftFps] = useState("");
  useEffect(() => {
    if (project) {
      setDraftDuration(String(project.duration));
      setDraftFps(String(project.fps));
    }
  }, [project?.id]);
  useEffect(() => setMounted(true), []);
  const [split, setSplit] = useState(() => {
    if (typeof window === "undefined") return 0.62;
    const stored = Number(window.sessionStorage.getItem(SPLIT_KEY));
    return Number.isFinite(stored) && stored > 0 && stored < 1 ? stored : 0.62;
  });
  useEffect(() => {
    window.sessionStorage.setItem(SPLIT_KEY, String(split));
  }, [split]);
  const [containerWidth, setContainerWidth] = useState(0);
  // The split container mounts only after the project loads (the loading
  // screen renders before it), so capture the element via a ref callback —
  // an effect with [] deps would run while the ref is still null.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerEl) return;
    const measure = () => {
      const width = containerEl.getBoundingClientRect().width;
      setContainerWidth(width);
      // Keep the stored split inside the 360px-per-side bounds for the
      // current container (e.g. after a viewport resize).
      const min = 360 / width;
      setSplit((prev) => Math.max(min, Math.min(1 - min, prev)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [containerEl]);

  const clock = useMemo<AnimationClockController>(() => {
    // duration/fps are project settings; recreated only when they change
    return new AnimationClockController(project?.duration ?? 3, project?.fps ?? 30);
  }, [project?.duration, project?.fps]);
  useClockDriver(clock);

  // Load project
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getStorage().getProject(projectId);
      if (cancelled) return;
      if (!loaded) {
        setMissing(true);
        return;
      }
      setProject(loaded);
      setCode(loaded.code);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Autosave (debounced) — the clock keeps playing while saving.
  const codeRef = useRef(code);
  codeRef.current = code;
  useEffect(() => {
    if (!project || !code || code === project.code) return;
    setSaveState("dirty");
    const handle = window.setTimeout(async () => {
      setSaveState("saving");
      const updated = await getStorage().updateProject(project.id, {
        code: codeRef.current ?? code,
      });
      setProject(updated);
      setSaveState("saved");
    }, 800);
    return () => window.clearTimeout(handle);
    // project intentionally omitted to avoid autosave-after-save loops
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps -- see comment

  // Schedule a thumbnail capture after the code has settled + compiled.
  useEffect(() => {
    if (!project || compileStatus.kind !== "ok") return;
    const handle = window.setTimeout(() => {
      clock.seek(0);
      setCaptureRequested(true);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [code, compileStatus.kind, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = useCallback(async () => {
    if (!project || !codeRef.current) return;
    setSaveState("saving");
    const updated = await getStorage().updateProject(project.id, {
      code: codeRef.current,
    });
    await getStorage().saveVersion(project.id, {
      code: codeRef.current,
      label: "Manual save",
    });
    setProject(updated);
    setSaveState("saved");
  }, [project]);

  // ---- Keyboard shortcuts -------------------------------------------------
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inTextEntry =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveNow();
        return;
      }
      if (inTextEntry) return; // Space/arrows don't hijack typing
      if (event.code === "Space") {
        event.preventDefault();
        clock.toggle();
        return;
      }
      if (event.metaKey || event.ctrlKey) return;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          clock.stepFrames(-1);
          break;
        case "ArrowRight":
          event.preventDefault();
          clock.stepFrames(1);
          break;
        case "j":
        case "J":
          clock.stepFrames(-1);
          break;
        case "k":
        case "K":
          clock.pause();
          break;
        case "l":
        case "L":
          clock.stepFrames(1);
          break;
        case "Escape":
          if (activeTool === "ai") setActiveTool("code");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clock, saveNow, activeTool]);

  // ---- Error panels --------------------------------------------------------
  useEffect(() => {
    if (compileStatus.kind !== "errors" || compileStatus.errors.length === 0) {
      return;
    }
    const first = compileStatus.errors[0];
    if (typeof first.line === "number" && typeof first.column === "number") {
      setErrorFocus((prev) => ({
        line: Math.min(first.line!, 100000),
        column: Math.max(1, first.column! + 1),
        token: prev ? prev.token + 1 : 1,
      }));
    }
  }, [compileStatus]);

  if (missing) {
    return <MissingProject />;
  }
  if (!project || code === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  const encoded = encodeURIComponent(projectId);
  const compileErrors =
    compileStatus.kind === "errors" ? compileStatus.errors : [];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* header */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to projects"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft />
        </Button>
        <input
          className="w-56 rounded-sm bg-transparent px-1.5 py-1 text-sm font-medium outline-none focus:bg-muted/60"
          value={project.name}
          aria-label="Project name"
          onChange={async (e) => {
            const updated = await getStorage().updateProject(project.id, {
              name: e.target.value,
            });
            setProject(updated);
          }}
        />
        <Badge variant="secondary" className="font-mono text-[10px]">
          {project.aspectRatio} · {project.width}×{project.height} · {project.fps}
          fps · {project.duration}s
        </Badge>

        <SaveIndicator state={saveState} />

        <div className="ml-auto flex items-center gap-1">
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="sm" aria-label="Project settings">
                <Settings />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground">
                  Animation settings
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="dur" className="text-xs">
                    Duration (seconds)
                  </Label>
                  <Input
                    id="dur"
                    type="number"
                    min={1}
                    step={0.5}
                    value={draftDuration}
                    onChange={(e) => setDraftDuration(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fps" className="text-xs">
                    Frame rate (fps)
                  </Label>
                  <Input
                    id="fps"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    value={draftFps}
                    onChange={(e) => setDraftFps(e.target.value)}
                    className="h-8"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const dur = Number(draftDuration);
                    const fps = Number(draftFps);
                    if (!Number.isFinite(dur) || dur <= 0) return;
                    if (!Number.isFinite(fps) || fps <= 0) return;
                    const updated = await getStorage().updateProject(
                      project.id,
                      { duration: dur, fps },
                    );
                    setProject(updated);
                  }}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" render={<Link href={`/projects/${encoded}/preview`} />}>
            Preview
          </Button>
          <Button size="sm" render={<Link href={`/projects/${encoded}/export`} />}>
            <Scissors />
            Export
          </Button>
        </div>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {/* icon rail */}
        <nav
          className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border py-2"
          aria-label="Workspace tools"
        >
          <RailButton
            icon={Code2}
            label="Code"
            active={activeTool === "code"}
            onClick={() => setActiveTool("code")}
          />
          <RailButton
            icon={Sparkles}
            label="AI"
            active={activeTool === "ai"}
            onClick={() => setActiveTool("ai")}
          />
          <div className="mt-auto flex flex-col items-center gap-1 pb-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle theme"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </Button>
          </div>
        </nav>

        {/* center: code / ai + editor — resizable split with the preview */}
        <div
          ref={(el) => {
            setContainerEl(el);
          }}
          className="relative flex min-h-0 min-w-0 flex-1"
        >
          <div
            className="flex min-w-0 flex-col border-r border-border"
            style={{
              width: `${split * 100}%`,
              flexShrink: 0,
            }}
          >
          {activeTool === "code" ? (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex h-7 shrink-0 items-center gap-2 border-b border-border bg-card px-3 font-mono text-[10px] text-muted-foreground">
                <span>{STAGE_FILE_NAME}</span>
                {compileStatus.kind === "compiling" ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> compiling
                  </span>
                ) : compileStatus.kind === "ok" ? (
                  <span className="text-brand">· compiled</span>
                ) : null}
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={wordWrap ? "Unwrap lines" : "Wrap lines"}
                    title={wordWrap ? "Unwrap lines" : "Wrap lines"}
                    onClick={() => setWordWrap((w) => !w)}
                  >
                    {wordWrap ? <WrapText /> : <AlignLeft />}
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditorPane
                  value={code ?? ""}
                  onChange={(v) => setCode(v ?? "")}
                  revealLine={errorFocus}
                  wordWrap={wordWrap}
                />
              </div>
              {compileErrors.length > 0 ? (
                <div
                  role="alert"
                  className="shrink-0 border-t border-destructive/40 bg-destructive/10 px-3 py-2"
                >
                  {compileErrors.slice(0, 4).map((error, i) => (
                    <button
                      key={i}
                      type="button"
                      className="block w-full truncate text-left font-mono text-[11px] text-destructive hover:underline"
                      onClick={() =>
                        typeof error.line === "number"
                          ? setErrorFocus((prev) => ({
                              line: Math.min(error.line!, 100000),
                              column: Math.max(1, (error.column ?? 0) + 1),
                              token: prev ? prev.token + 1 : 1,
                            }))
                          : undefined
                      }
                    >
                      {typeof error.line === "number"
                        ? `L${error.line}:${error.column ?? 1} — `
                        : ""}
                      {error.message}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <AIWorkspace />
          )}
        </div>

        {/* resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and preview"
          className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-brand/60"
          onPointerDown={(e) => {
            if (e.button !== 0 || containerWidth <= 0) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* synthetic events (tests) may not support capture */
            }
            const startX = e.clientX;
            const startSplit = split;
            const minEditor = 360 / containerWidth;
            const maxEditor = 1 - 360 / containerWidth;
            const move = (ev: PointerEvent) => {
              const next = Math.max(
                minEditor,
                Math.min(maxEditor, startSplit + (ev.clientX - startX) / containerWidth),
              );
              setSplit(next);
            };
            const up = () => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* synthetic events (tests) never captured */
              }
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
              window.removeEventListener("pointercancel", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
            window.addEventListener("pointercancel", up);
          }}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-brand/60" />
        </div>

        {/* right: preview + timeline */}
        <div
          className="flex min-w-0 flex-col"
          style={{ width: `${(1 - split) * 100}%`, flexShrink: 0 }}
        >
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-accent/40 p-4">
            <StageFitter width={project.width} height={project.height}>
              {(scale) => (
                <div
                  className="relative overflow-hidden shadow-xl shadow-black/40 outline-none ring-border/60 ring-1"
                  style={{
                    width: Math.round(project.width * scale),
                    height: Math.round(project.height * scale),
                  }}
                >
                  {/* The iframe is mounted at TRUE project pixel size; the
                      transform scales it visually without affecting renders. */}
                  <div
                    style={{
                      width: project.width,
                      height: project.height,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <PreviewRuntime
                      project={project}
                      clock={clock}
                      onCompileStatus={setCompileStatus}
                      onRuntimeStatus={setRuntimeStatus}
                      captureToken={captureRequested ? 1 : 0}
                      onFrame={async (dataURL) => {
                        setCaptureRequested(false);
                        try {
                          const thumb = await downscaleDataURL(dataURL, 480, 0.8);
                          const updated = await getStorage().updateProject(project.id, {
                            thumbnail: thumb,
                          });
                          setProject(updated);
                        } catch (e) {
                          console.error("thumbnail capture failed", e);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </StageFitter>

            {/* transport overlays the stage bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <TransportControls
                project={project}
                clock={clock}
                projectId={projectId}
              />
            </div>

            {runtimeStatus.kind === "load_error" ? (
              <RuntimeErrorCard
                message={runtimeStatus.message}
                stack={runtimeStatus.stack}
                onLocate={(line, column) =>
                  {
                    setActiveTool("code");
                    setErrorFocus((prev) => ({
                      line: Math.min(line, 100000),
                      column: Math.max(1, column + 1),
                      token: prev ? prev.token + 1 : 1,
                    }));
                  }
                }
                onDismiss={() => setRuntimeStatus({ kind: "ready" })}
              />
            ) : null}
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2">
            <Timeline clock={clock} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={400}
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SaveIndicator({ state }: { state: "saved" | "saving" | "dirty" }) {
  return (
    <span className="ml-auto mr-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
      {state === "saving" ? (
        <>
          <Loader2 className="size-3 animate-spin" /> saving
        </>
      ) : state === "dirty" ? (
        <>unsaved</>
      ) : (
        <>
          <Save className="size-3" /> saved
        </>
      )}
    </span>
  );
}

/**
 * Measures its own box and hands children a scale factor that fits the
 * project stage inside it.
 */
function RuntimeErrorCard({
  message,
  stack,
  onLocate,
  onDismiss,
}: {
  message: string;
  stack?: string;
  onLocate: (line: number, column: number) => void;
  onDismiss: () => void;
}) {
  const location = /(?:at\s+.*?|).*?:(\d+):(\d+)/.exec(stack?.split("\n")[0] ?? "");
  const line = location ? Number(location[1]) : 1;
  const column = location ? Number(location[2]) : 1;
  return (
    <div
      role="alert"
      className="absolute left-4 right-4 top-4 z-20 rounded-md border border-destructive/50 bg-background/95 p-3 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
        <span className="font-mono text-[11px] font-medium text-destructive">
          Runtime error
        </span>
        <button
          type="button"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onLocate(line, column)}
        >
          Go to code
        </button>
        <button
          type="button"
          aria-label="Dismiss error"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[11px] leading-5 text-foreground">
        {message}
      </p>
    </div>
  );
}

function AiWorkspacePlaceholder({ onEscape }: { onEscape: () => void }) {
  void onEscape;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
      <Sparkles className="size-6 text-muted-foreground/50" aria-hidden />
      <p className="text-sm font-medium text-foreground">AI workspace</p>
      <p className="max-w-xs text-xs leading-5 text-muted-foreground">
        The assistant reads your animation code, project settings and runtime
        errors, then proposes edits as diffs. Bring your own key — AI is
        optional and everything works without it.
      </p>
      <Button variant="outline" size="sm" disabled>
        Configure provider (soon)
      </Button>
    </div>
  );
}

function MissingProject() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
      <CircleAlert className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm text-foreground">This project could not be found.</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        It may have been deleted, or it was created in another browser profile
        (projects are stored locally).
      </p>
      <Button size="sm" render={<Link href="/dashboard" />}>
        Back to projects
      </Button>
    </div>
  );
}
