import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EXAMPLES } from "@/lib/examples";

export default function ExamplesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <span className="font-semibold tracking-tight">Reosion</span>
          </Link>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" render={<Link href="/" />}>
              <ArrowLeft />
              Back
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Examples</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Six animations you can open, remix and make your own.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <Link
              key={ex.slug}
              href={"/examples/" + ex.slug}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/40"
            >
              <h2 className="text-base font-medium text-foreground">{ex.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{ex.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground group-hover:text-foreground">
                Open <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}