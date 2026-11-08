/**
 * ProjectStorage — the single persistence boundary of the application.
 *
 * All project data lives in IndexedDB in the browser (local-first: no server
 * involved). The interface is deliberately persistence-agnostic so a future
 * desktop app (Tauri/FS) or an optional cloud sync can be introduced without
 * touching product code.
 */

import type { Project, ProjectVersion, ProjectSettings } from "@/lib/types";
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reosion";
const DB_VERSION = 1;

export interface ProjectStorage {
  createProject(input: {
    name: string;
    settings: ProjectSettings;
    code: string;
  }): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
  putProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  listProjects(): Promise<Project[]>;
  saveVersion(
    projectId: string,
    opts: { code: string; label?: string },
  ): Promise<ProjectVersion>;
  getVersions(projectId: string): Promise<ProjectVersion[]>;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Minimal structural type for our two stores; values are typed at call sites. */
interface ReosionSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { updatedAt: number };
  };
  versions: {
    key: string;
    value: ProjectVersion;
    indexes: { projectId: string };
  };
}

type Db = IDBPDatabase<ReosionSchema>;

class IndexedDBProjectStorage implements ProjectStorage {
  private dbPromise: Promise<Db>;

  constructor() {
    this.dbPromise = openDB<ReosionSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          const projects = db.createObjectStore("projects", { keyPath: "id" });
          projects.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains("versions")) {
          const versions = db.createObjectStore("versions", { keyPath: "id" });
          versions.createIndex("projectId", "projectId");
        }
      },
    });
  }

  async createProject(input: {
    name: string;
    settings: ProjectSettings;
    code: string;
  }): Promise<Project> {
    const now = Date.now();
    const project: Project = {
      id: makeId(),
      name: input.name,
      aspectRatio: input.settings.aspectRatio,
      width: input.settings.width,
      height: input.settings.height,
      fps: input.settings.fps,
      duration: input.settings.duration,
      code: input.code,
      createdAt: now,
      updatedAt: now,
    };
    const db = await this.dbPromise;
    await db.put("projects", project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const db = await this.dbPromise;
    return db.get("projects", id);
  }

  async putProject(project: Project): Promise<void> {
    const db = await this.dbPromise;
    await db.put("projects", project);
  }

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    const db = await this.dbPromise;
    const existing = await db.get("projects", id);
    if (!existing) throw new Error(`Project not found: ${id}`);
    const next: Project = { ...existing, ...patch, id, updatedAt: Date.now() };
    await db.put("projects", next);
    return next;
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.dbPromise;
    const versions = await db.getAllFromIndex(
      "versions",
      "projectId",
      id,
    );
    const tx = db.transaction(["projects", "versions"], "readwrite");
    tx.objectStore("projects").delete(id);
    for (const version of versions) {
      tx.objectStore("versions").delete(version.id);
    }
    await tx.done;
  }

  async listProjects(): Promise<Project[]> {
    const db = await this.dbPromise;
    const projects = await db.getAll("projects");
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async saveVersion(
    projectId: string,
    opts: { code: string; label?: string },
  ): Promise<ProjectVersion> {
    const version: ProjectVersion = {
      id: makeId(),
      projectId,
      code: opts.code,
      label: opts.label,
      createdAt: Date.now(),
    };
    const db = await this.dbPromise;
    await db.put("versions", version);
    // keep ~50 versions per project
    const all = await db.getAllFromIndex("versions", "projectId", projectId);
    const overflow = all.sort((a, b) => b.createdAt - a.createdAt).slice(50);
    for (const stale of overflow) {
      await db.delete("versions", stale.id);
    }
    return version;
  }

  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const db = await this.dbPromise;
    return (await db.getAllFromIndex("versions", "projectId", projectId)).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }
}

let singleton: ProjectStorage | null = null;

/** Returns the process-wide storage (IndexedDB-backed). Client-side only. */
export function getStorage(): ProjectStorage {
  if (!singleton) singleton = new IndexedDBProjectStorage();
  return singleton;
}
