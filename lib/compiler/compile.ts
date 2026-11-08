/**
 * The local compiler.
 *
 * Transforms user TypeScript/JSX into a single self-contained ES module that
 * runs inside the sandboxed preview iframe. All local, all in the browser
 * (esbuild-wasm) — no server involved.
 *
 * The sandbox exposes a controlled dependency set. User imports of those
 * modules are rewritten at bundle time to point at objects injected into the
 * runtime (`globalThis.__reosionDeps`), everything else is a compile error.
 */

export interface CompileDiagnostic {
  message: string;
  line?: number;
  column?: number;
}

export type CompileResult =
  | { ok: true; js: string; warnings: string[] }
  | { ok: false; errors: CompileDiagnostic[] };

/**
 * Modules the sandbox runtime headers inject. Anything else does not exist
 * for user code (yet).
 */
export const ALLOWED_IMPORTS = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
  "framer-motion",
  "@reosion/runtime",
  "lucide-react",
] as const;

export type AllowedImport = (typeof ALLOWED_IMPORTS)[number];

let compilerReady: Promise<boolean> | null = null;

async function ensureCompiler(): Promise<boolean> {
  if (!compilerReady) {
    compilerReady = (async () => {
      const esbuild = await import("esbuild-wasm");
      await esbuild.initialize({
        wasmURL: "/vendor/esbuild/esbuild.wasm",
      });
      return true;
    })().catch((e) => {
      console.error("Compiler failed to initialize", e);
      throw e;
    });
  }
  return compilerReady.then(() => true).catch(() => false);
}

function stubModuleSource(name: string): string {
  const literal = JSON.stringify(name);
  if (name === "lucide-react") {
    // Icons live in a lazy namespace so all named icon imports work.
    return `const icons = globalThis.__reosionDeps["lucide-react"];
module.exports = icons;`;
  }
  return `module.exports = globalThis.__reosionDeps[${literal}];`;
}

function isAllowedNamespace(name: string): name is AllowedImport {
  return (ALLOWED_IMPORTS as readonly string[]).includes(name);
}

/**
 * Compiles a single-file animation (Animation.tsx) into a self-contained ES
 * module bundle string.
 */
export async function compileUserCode(source: string): Promise<CompileResult> {
  if (!(await ensureCompiler())) {
    return {
      ok: false,
      errors: [{ message: "Compiler unavailable. (esbuild-wasm failed to load)" }],
    };
  }

  const esbuild = await import("esbuild-wasm");

  // Namespaced virtual modules injected by the runtime.
  const stubPlugin: import("esbuild-wasm").Plugin = {
    name: "reosion-runtime-deps",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        // Relative imports resolve to the single-file virtual project.
        if (args.path.startsWith(".") || args.path.startsWith("/")) {
          return null; // let esbuild error naturally (file not found)
        }
        const bare = args.path.startsWith("node:")
          ? args.path.replace(/^node:/, "")
          : args.path;
        if (isAllowedNamespace(bare) || bare === "react/jsx-runtime") {
          return { path: bare, namespace: "runtime-deps" };
        }
        return {
          errors: [
            {
              text: `The package \u201C${args.path}\u201D is not available in the sandbox yet.`,
              detail:
                "Contact set: react, framer-motion, lucide-react and @reosion/runtime.",
            },
          ],
        };
      });
      build.onLoad({ filter: /.*/, namespace: "runtime-deps" }, (args) => {
        return {
          contents: stubModuleSource(args.path),
          loader: "js",
        };
      });
      build.onLoad({ filter: /\.tsx$/, namespace: "user-src" }, () => ({
        contents: source,
        loader: "tsx",
      }));
      build.onResolve({ filter: /^entry\.tsx$/ }, () => ({
        path: "entry.tsx",
        namespace: "user-src",
      }));
    },
  };

  try {
    const result = await esbuild.build({
      entryPoints: ["entry.tsx"],
      bundle: true,
      write: false,
      format: "esm",
      jsx: "automatic",
      target: "es2022",
      loader: { ".tsx": "tsx", ".ts": "ts" },
      plugins: [stubPlugin],
      absWorkingDir: "/",
      define: { "process.env.NODE_ENV": '"production"' },
    });
    return { ok: true, js: result.outputFiles![0].text, warnings: [] };
  } catch (e) {
    if (!("errors" in (e as object))) throw e;
    const esbuildError = e as { errors: Array<{
      text: string;
      location?: { line: number; column: number };
    }> };
    const errors: CompileDiagnostic[] = esbuildError.errors.map((err) => ({
      message: err.text,
      line: err.location?.line,
      column: err.location?.column,
    }));
    return { ok: false, errors };
  }
}
