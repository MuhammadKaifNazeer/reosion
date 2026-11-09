/**
 * Builds the sandbox runtime bundle (`public/runtime.js`).
 *
 * Output: a single self-executing script with the browser Tailwind runtime
 * prepended as a banner, executed inside the sandboxed iframe via the
 * /sandbox bootstrap document. Requires `npm run setup:vendor` + dev
 * dependencies (esbuild).
 */
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const tailwindBrowser = readFileSync(
  new URL("../node_modules/@tailwindcss/browser/dist/index.global.js", import.meta.url),
  "utf8",
);

try {
  await build({
    entryPoints: ["runtime/src/index.tsx"],
    outfile: "public/runtime.js",
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2022",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: tailwindBrowser },
    logLevel: "info",
  });
} catch (error) {
  console.error("[build-runtime] failed:", error);
  process.exit(1);
}
