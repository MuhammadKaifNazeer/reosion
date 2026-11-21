import { ArrowRight } from "lucide-react";

const PIPELINE = [
  "Animation.tsx",
  "Local React runtime",
  "Live preview",
  "Deterministic renderer",
  "Local encoder",
  "Download",
] as const;

export function LandingLocalFirst() {
  return (
    <section id="local-first" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Local-first by architecture.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Editing, compiling, previewing and rendering all happen in
              your browser and on your CPU. No accounts are required to make
              a video; exports stay on the machine that rendered them.
            </p>
            <p className="mt-4 font-mono text-xs text-foreground">
              Your code. Your files. Your machine.
            </p>
          </div>
          <ol className="space-y-0 rounded-lg border border-border bg-card font-mono text-xs">
            {PIPELINE.map((node, i) => (
              <li key={node} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                <span className="text-muted-foreground">0{i + 1}</span>
                <span className="text-foreground">{node}</span>
                {i === PIPELINE.length - 1 ? (
                  <span className="ml-auto text-brand">blob → download</span>
                ) : (
                  <ArrowRight className="ml-auto size-3 text-muted-foreground" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}