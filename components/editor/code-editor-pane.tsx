"use client";

import { Component, useEffect, useRef, useState } from "react";
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

/** The TypeScript service namespace (top-level in monaco-editor 0.57 ESM). */
type MonacoTypescriptApi = typeof import("monaco-editor")["typescript"];

// ---------------------------------------------------------------------------
// Error boundary that recovers from transient Monaco lifecycle crashes
// (e.g. "InstantiationService has been disposed") by recreating the editor.
// Bounded to a few attempts to avoid infinite remount loops.
// ---------------------------------------------------------------------------
interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
  hasError: boolean;
}
interface EditorErrorBoundaryState {
  hasError: boolean;
}
class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[code-editor-pane] editor crashed:", error);
    this.props.onReset();
  }
  componentDidUpdate(prevProps: EditorErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground">
            Reloading editor…
          </span>
        </div>
      );
    }
    return this.props.children;
  }
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
  const [monacoReady, setMonacoReady] = useState(false);
  const [remountKey, setRemountKey] = useState(0);
  const [crashCount, setCrashCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const monaco = await import("monaco-editor");
      loader.config({ monaco });
      if (!cancelled) setMonacoReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (revealLine) {
      editorRef.current?.reveal(revealLine.line, revealLine.column);
    }
  }, [revealLine]);

  const handleMount: OnMount = (editor, monacoInstance: Monaco) => {
    try {
      editorRef.current = {
        reveal: (line, column) => {
          try {
            editor.revealLineInCenter(line);
            editor.setPosition({ lineNumber: line, column });
            editor.focus();
          } catch (error) {
            console.warn("[code-editor-pane] reveal skipped:", error);
          }
        },
      };

      const ts =
        (monacoInstance as unknown as { typescript?: MonacoTypescriptApi })
          .typescript ??
        (monacoInstance.languages as unknown as {
          typescript?: MonacoTypescriptApi;
        } | null)?.typescript;
      if (!ts) {
        console.error(
          "[code-editor-pane] monaco instance lacks the TypeScript language service; skipping TS configuration",
        );
        return;
      }
      ts.typescriptDefaults.setCompilerOptions({
        target: ts.ScriptTarget.ESNext,
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

      for (const lib of EXTRA_LIBS) {
        ts.typescriptDefaults.addExtraLib(
          lib.content,
          `file:///node_modules/${lib.path}`,
        );
      }
    } catch (e) {
      console.error("[code-editor-pane] handleMount threw:", e);
    }
  };

  const handleError = () => {
    if (crashCount < 3) {
      setCrashCount((c) => c + 1);
      setRemountKey((k) => k + 1);
    }
  };

  if (!monacoReady) {
    return (
      <div className="flex items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground">
          Loading editor…
        </span>
      </div>
    );
  }

  if (crashCount >= 3) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          Editor failed to load.
        </span>
        <button
          type="button"
          className="font-mono text-xs text-brand hover:underline"
          onClick={() => {
            setCrashCount(0);
            setRemountKey((k) => k + 1);
          }}
        >
          Reload editor
        </button>
      </div>
    );
  }

  return (
    <EditorErrorBoundary
      onReset={handleError}
      hasError={crashCount > 0 && crashCount < 3}
    >
      <Editor
        key={remountKey}
        theme="vs-dark"
        language="typescript"
        path="file:///Animation.tsx"
        keepCurrentModel
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
    </EditorErrorBoundary>
  );
}