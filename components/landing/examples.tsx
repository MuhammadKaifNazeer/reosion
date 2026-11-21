import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingExamples() {
  return (
    <section id="examples" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Start from an example.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Six animations you can open, remix and make your own. Pick
              one, tweak the code, and export a video in seconds.
            </p>
            <div className="mt-6">
              <Button size="lg" render={<Link href="/examples" />}>
                Browse examples
                <ArrowRight />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 font-mono text-xs leading-6 text-muted-foreground">
            <p className="text-foreground">examples</p>
            <p className="mt-2">caching · hello-motion · bouncing-ball</p>
            <p>fade-in-cards · progress-bar · wave</p>
            <p className="mt-4 text-muted-foreground">
              Open any example, press Remix, and it becomes your project.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}