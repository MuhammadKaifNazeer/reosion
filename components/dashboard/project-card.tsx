"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCode2,
  LayoutGrid,
  List,
  MoreVertical,
  Play,
  Scissors,
  Search,
  SquarePlus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDimensions, formatRelativeTime } from "@/lib/format";
import { getStorage } from "@/lib/projects/storage";
import type { Project } from "@/lib/types";

/**
 * The projects dashboard. All data is read straight from local IndexedDB —
 * this screen has no server dependency.
 */
export function DashboardScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function load() {
      // load-on-mount: projects come from IndexedDB (async, non-cascading)
       
      setProjects(await getStorage().listProjects());
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!projects) return null;
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const handleDelete = async (project: Project) => {
    await getStorage().deleteProject(project.id);
    setProjects(await getStorage().listProjects());
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="text-xs text-muted-foreground">
            Stored locally in your browser.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              className="w-56 pl-8"
              aria-label="Search projects"
            />
          </div>
          {/* grid / list view toggle */}
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`flex size-7 items-center justify-center rounded-sm transition-colors ${
                view === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`flex size-7 items-center justify-center rounded-sm transition-colors ${
                view === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
            </button>
          </div>
          <Button render={<Link href="/projects/new" />}>
            <SquarePlus />
            New Project
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {filtered === null ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={Boolean(query.trim())} />
        ) : (
          <ul
            className={
              view === "grid"
                ? "grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2"
            }
            aria-label="Projects"
          >
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                view={view}
                onOpen={() => router.push(`/projects/${project.id}`)}
                onPreview={() => router.push(`/projects/${project.id}/preview`)}
                onExport={() => router.push(`/projects/${project.id}/export`)}
                onDelete={() => void handleDelete(project)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="rounded-lg border border-dashed border-border px-8 py-16 text-center text-sm text-muted-foreground">
        No projects match your search.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-8 py-16 text-center">
      <FileCode2 className="size-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-sm font-medium text-foreground">
        No projects yet
      </h2>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
        Write your first animation in React. Create a project and the editor
        opens with working starter code.
      </p>
      <Button className="mt-5" render={<Link href="/projects/new" />}>
        <SquarePlus />
        New Project
      </Button>
    </div>
  );
}

function ProjectCard({
  project,
  view = "grid",
  onOpen,
  onPreview,
  onExport,
  onDelete,
}: {
  project: Project;
  view?: "grid" | "list";
  onOpen: () => void;
  onPreview: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const isList = view === "list";
  return (
    <li className="group">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={`cursor-pointer rounded-lg border border-border bg-card outline-none transition-colors hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${
          isList ? "flex items-center gap-3 p-2" : ""
        }`}
      >
        {/* Real animation frame captured from the runtime (thumbnail field). */}
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#09090b] ${
            isList ? "h-16 w-28 rounded-md" : "aspect-[16/9] w-full"
          }`}
        >
          {project.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL, not a remote asset
            <img
              src={project.thumbnail}
              alt={`${project.name} preview frame`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <FileCode2
              className="size-8 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110"
              aria-hidden
            />
          )}
        </div>
        {isList ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {project.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {project.aspectRatio} ·{" "}
                {formatDimensions(project.width, project.height)} · {project.duration}
                s · {formatRelativeTime(project.updatedAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton
                render={
                  <button
                    type="button"
                    aria-label="Project actions"
                    aria-haspopup="menu"
                    className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted aria-expanded:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onPreview}>
                  <Play /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Scissors /> Export
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="border-t-border flex items-center gap-2 border-t px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {project.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {project.aspectRatio} ·{" "}
                {formatDimensions(project.width, project.height)} · {project.duration}
                s · {formatRelativeTime(project.updatedAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton
                render={
                  <button
                    type="button"
                    aria-label="Project actions"
                    aria-haspopup="menu"
                    className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted aria-expanded:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onPreview}>
                  <Play /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Scissors /> Export
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </li>
  );
}
