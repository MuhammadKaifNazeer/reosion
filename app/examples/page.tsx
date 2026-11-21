"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExamplesGrid } from "@/components/examples/examples-grid";

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
        <ExamplesGrid />
      </main>
    </div>
  );
}