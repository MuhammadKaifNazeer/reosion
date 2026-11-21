import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const DEMO_CODE = `import { motion } from "framer-motion";
import { useTime } from "@reosion/runtime";

export default function Animation() {
  const t = useTime();

  return (
    <main className="stage">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Motion, in React.
      </motion.h1>

      <div
        className="bar"
        style={{ width: 80 + Math.sin(t * Math.PI) * 120 }}
      />
    </main>
  );
}`;

export function LandingHero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-brand" />
          Open source &amp; local-first
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Motion graphics,{" "}
          <span className="text-muted-foreground">written in</span> React.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
          Build animations with React, Tailwind and Motion. Preview
          instantly. Export to video — on your machine, for free, forever.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" render={<Link href="/dashboard" />}>
            Start creating
            <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={
              <a href="https://github.com/MuhammadKaifNazeer/reosion" target="_blank" rel="noreferrer" />
            }
          >
            View on GitHub
          </Button>
        </div>

        {/* Code -> Motion demonstration */}
        <div className="mt-16 grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[1fr_24px_1fr]">
          <div className="flex min-w-0 flex-col border-b border-border md:h-[360px] md:border-b-0 md:border-r">
            <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2.5">
              <span className="size-2 rounded-full bg-muted" />
              <span className="size-2 rounded-full bg-muted" />
              <span className="size-2 rounded-full bg-muted" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                Animation.tsx
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                tsx
              </span>
            </div>
            <pre className="landing-code h-[220px] overflow-auto p-4 font-mono text-xs leading-6 text-muted-foreground md:h-auto md:flex-1">
              <code>{DEMO_CODE}</code>
            </pre>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="reosion-demo relative flex h-[320px] items-center justify-center overflow-hidden bg-[#0a0a0b] p-5 md:h-[360px]">
            <div className="relative h-full w-full max-w-[390px] overflow-hidden rounded-md border border-border/60 bg-background/40">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--muted-foreground) 22%, transparent) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative flex h-full flex-col items-center justify-center px-6 pb-8 text-center">
                <span className="mb-5 inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-background/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-brand" style={{ animation: "reosion-demo-pulse 3s ease-in-out infinite" }} />
                  Live preview
                </span>
                <p className="text-2xl font-semibold tracking-tight text-foreground" style={{ animation: "reosion-demo-title 6s cubic-bezier(0.16, 1, 0.3, 1) infinite" }}>
                  Motion, in React.
                </p>
                <div className="mt-3 h-[3px] w-24 overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full w-full origin-left rounded-full" style={{ background: "linear-gradient(90deg, var(--brand), #a78bfa)", animation: "reosion-demo-underline 6s cubic-bezier(0.16, 1, 0.3, 1) infinite" }} />
                </div>
                <div className="relative mt-8 h-1 w-44 rounded-full bg-muted/30">
                  <div className="absolute size-2.5 rounded-full bg-brand" style={{ top: "50%", transform: "translateY(-50%)", boxShadow: "0 0 12px var(--brand)", animation: "reosion-demo-dot 6s cubic-bezier(0.65, 0, 0.35, 1) infinite" }} />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground" style={{ animation: "reosion-demo-caption 6s linear infinite" }}>
                  1920 × 1080 · 30fps · mp4
                </p>
              </div>
              <div className="absolute inset-x-4 bottom-3 h-0.5 overflow-hidden rounded-full bg-muted/20">
                <div className="h-full w-full origin-left rounded-full bg-brand/70" style={{ animation: "reosion-demo-progress 6s linear infinite" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}