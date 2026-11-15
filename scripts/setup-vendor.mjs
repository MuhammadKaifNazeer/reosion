/**
 * Copies third-party runtime assets from node_modules into public/.
 *
 * These assets are large binary/wasm bundles that must be served locally
 * (the platform is local-first and must run fully offline), so they are
 * copied from node_modules instead of being committed to git.
 *
 * Sources:
 *  - esbuild-wasm      -> public/vendor/esbuild/  (in-browser TS/JSX compiler)
 *  - @ffmpeg/core      -> public/ffmpeg/          (local MP4/WebM encoder)
 *
 * For ffmpeg an extra self-contained worker bundle is produced by
 * concatenating the ESM worker sources (worker.js has no static imports
 * besides the three files prepended here), so it can be loaded at runtime
 * without going through the bundler's worker resolution.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";

const copies = [
  {
    from: "node_modules/esbuild-wasm/esbuild.wasm",
    to: "public/vendor/esbuild/esbuild.wasm",
  },
  {
    from: "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js",
    to: "public/ffmpeg/ffmpeg-core.js",
  },
  {
    from: "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
    to: "public/ffmpeg/ffmpeg-core.wasm",
  },
  // ESM build of the core, dynamically imported by the module-type worker.
  {
    from: "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js",
    to: "public/ffmpeg/ffmpeg-core-esm.js",
  },
  {
    from: "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm",
    to: "public/ffmpeg/ffmpeg-core-esm.wasm",
  },
];

let copied = 0;
for (const { from, to } of copies) {
  const source = join(root, from);
  const dest = join(root, to);
  if (!existsSync(source)) {
    console.warn(`[setup-vendor] missing: ${from} (skipped)`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(source, dest);
  copied++;
}

// Self-contained ffmpeg worker (module type, no external imports).
const esmDir = "node_modules/@ffmpeg/ffmpeg/dist/esm";
try {
  const parts = ["const.js", "errors.js", "utils.js", "worker.js"];
  const chunks = parts.map((part) => {
    const source = readFileSync(join(root, esmDir, part), "utf8");
    return `// ---- ${part} ----\n${source}`;
  });
  // Strip static import statements — everything they refer to is inlined above.
  const worker = chunks
    .join("\n")
    .replace(/^import\s+.*?;$/gm, "")
    .replace(/export\s+default\s+/g, "export default ");
  writeFileSync(join(root, "public/ffmpeg/ffmpeg-worker.mjs"), worker);
  copied++;
} catch (error) {
  console.warn(
    `[setup-vendor] could not bundle ffmpeg worker: ${error instanceof Error ? error.message : String(error)}`,
  );
}

console.log(`[setup-vendor] ${copied}/${copies.length + 1} assets ready in public/`);
