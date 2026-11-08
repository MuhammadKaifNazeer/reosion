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
 */
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
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

console.log(`[setup-vendor] ${copied}/${copies.length} assets ready in public/`);
