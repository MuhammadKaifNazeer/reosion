"use client";

import { useEffect, useRef } from "react";
import Editor, {
  loader,
  type Monaco,
  type OnMount,
} from "@monaco-editor/react";

import { EXTRA_LIBS } from "@/lib/editor/extra-libs";

/**
 * Monaco editor pane with a fully local toolchain: monaco is bundled by
 * Next (no CDN loader), workers are bundled as web workers, and the
 * language service gets our runtime/library type stubs.
 */

let configured = false;
function configure() {
  if (configured) return;
  configured = true;

  (self as unknown as {
    MonacoEnvironment?: {
      getWorker: (moduleId: string, label: string) => Worker;
    };
  }).MonacoEnvironment = {
    getWorker(moduleId: string, label: string) {
      if (label === "typescript" || label === "javascript") {
        return new Worker(
          new URL(
            "../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
            import.meta.url,
          ),
          { type: "module", name: "ts-worker" },
        );
      }
      void moduleId;
      return new Worker(
        new URL(
          "../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
          import.meta.url,
        ),
        { type: "module", name: "editor-worker" },
      );
    },
  };
}

// Guard: this module is also evaluated during SSR; workers only apply to the browser.
if (typeof window !== "undefined") {
  configure();

  // loader.config needs the monaco instance; do it lazily on module load so the
  // heavy editor chunk stays out of the main bundle.
  void (async () => {
    const monaco = await import("monaco-editor");
    loader.config({ monaco });
  })();
}

export interface CodeEditorPaneProps {
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  /** Position the editor should jump to (compile/runtime error location). */
  revealLine?: { line: number; column: number; token: number } | null;
  /** Toggle Monaco word wrap. */
  wordWrap?: boolean;
}

export function CodeEditorPane({
  value,
  onChange,
  readOnly = false,
  revealLine,
  wordWrap = false,
}: CodeEditorPaneProps) {
  const editorRef = useRef<{
    reveal: (line: number, column: number) => void;
  } | null>(null);

  useEffect(() => {
    if (revealLine) {
      editorRef.current?.reveal(revealLine.line, revealLine.column);
    }
  }, [revealLine]);

  const handleMount: OnMount = (editor, monacoInstance: Monaco) => {
    editorRef.current = {
      reveal: (line, column) => {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column });
        editor.focus();
      },
    };

    const ts = monacoInstance.languages.typescript;
    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.ReactJSX,
      allowNonTsExtensions: true,
      noEmit: true,
      esModuleInterop: true,
    });
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    ts.typescriptDefaults.setEagerModelSync(true);

    // Register runtime stubs so developer tooling inside the product matches
    // what the sandbox runtime actually provides.
    for (const lib of EXTRA_LIBS) {
      ts.typescriptDefaults.addExtraLib(
        lib.content,
        `file:///node_modules/${lib.path}`,
      );
    }
  };

  return (
    <Editor
      theme="vs-dark"
      language="typescript"
      // A .tsx model path is required so the language service parses JSX
      // with proper TSX semantics (default models get plain .ts rules).
      path="file:///Animation.tsx"
      value={value}
      onChange={onChange}
      onMount={handleMount}
      loading={
        <span className="font-mono text-xs text-muted-foreground">
          Loading editor…
        </span>
      }
      options={{
        readOnly,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        wordWrap: wordWrap ? "on" : "off",
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "none",
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          useShadows: false,
        },
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        bracketPairColorization: { enabled: true },
        stickyScroll: { enabled: false },
      }}
    />
  );
}
