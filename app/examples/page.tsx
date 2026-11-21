"use client";

import { ExamplesGrid } from "@/components/examples/examples-grid";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function ExamplesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Examples</h1>
        <p className="my-2 max-w-xl text-muted-foreground">
          Six animations you can open, remix and make your own.
        </p>
        <div className="mt-10">
          <ExamplesGrid />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
