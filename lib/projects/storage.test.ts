import { beforeAll, describe, expect, it } from "vitest";
import type { ProjectStorage } from "@/lib/projects/storage";

/**
 * Runs ProjectStorage against fake-indexeddb to verify the persistence
 * abstraction works end-to-end without a real browser.
 */

let storage: ProjectStorage;

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shim = (await import("fake-indexeddb")) as unknown as Record<
    string,
    unknown
  >;
  const g = globalThis as unknown as Record<string, unknown>;
  for (const key of [
    "indexedDB",
    "IDBKeyRange",
    "IDBRequest",
    "IDBOpenDBRequest",
    "IDBVersionChangeEvent",
    "IDBDatabase",
    "IDBTransaction",
    "IDBObjectStore",
    "IDBIndex",
    "IDBCursor",
    "IDBCursorWithValue",
  ]) {
    g[key] = shim[key];
  }
  const { getStorage } = await import("@/lib/projects/storage");
  storage = getStorage();
});

describe("ProjectStorage (IndexedDB)", () => {
  it("creates, lists and reads projects", async () => {
    const created = await storage.createProject({
      name: "Test Project",
      settings: { aspectRatio: "16:9", width: 1920, height: 1080, fps: 30, duration: 3 },
      code: "export default () => <div/>;",
    });

    expect(created.id).toBeTruthy();
    expect(created.aspectRatio).toBe("16:9");
    expect(created.width).toBe(1920);
    expect(created.fps).toBe(30);

    const listed = await storage.listProjects();
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe("Test Project");

    const read = await storage.getProject(created.id);
    expect(read?.code).toBe("export default () => <div/>;");
  });

  it("updates and deletes projects", async () => {
    const created = await storage.createProject({
      name: "Second",
      settings: { aspectRatio: "1:1", width: 1080, height: 1080, fps: 30, duration: 2 },
      code: "export default 1;",
    });

    const updated = await storage.updateProject(created.id, { name: "Second (renamed)" });
    expect(updated.name).toBe("Second (renamed)");
    expect(updated.id).toBe(created.id);

    await storage.deleteProject(created.id);
    expect(await storage.getProject(created.id)).toBeUndefined();
    expect(await storage.listProjects()).toHaveLength(1);
  });

  it("saves and lists versions, trimming old ones", async () => {
    const project = await storage.createProject({
      name: "Versioned",
      settings: { aspectRatio: "9:16", width: 1080, height: 1920, fps: 30, duration: 3 },
      code: "v0",
    });

    for (let i = 0; i < 55; i++) {
      await storage.saveVersion(project.id, { code: `v${i}` });
    }

    const versions = await storage.getVersions(project.id);
    expect(versions.length).toBeLessThanOrEqual(50); // 50 kept
    expect(versions[0].code).toBe("v54"); // newest first
    expect(versions[0].projectId).toBe(project.id);
    await storage.deleteProject(project.id);
    expect(await storage.getVersions(project.id)).toHaveLength(0);
  });
});
