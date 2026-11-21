import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExamplesGrid } from "@/components/examples/examples-grid";

export function LandingExamples() {
  return (
    <section id="examples" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Examples
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Six animations you can open, remix and make your own.
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/examples" />}>
            Show all
            <ArrowRight />
          </Button>
        </div>
        <div className="mt-10">
          <ExamplesGrid limit={6} />
        </div>
      </div>
    </section>
  );
}