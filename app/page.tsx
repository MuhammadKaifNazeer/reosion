import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Download,
  FileCode2,
  Layers,
  Sparkles,
  Unlock,
  MonitorPlay,
} from "lucide-react";

import { Logo, Wordmark } from "@/components/app-shell/logo";
import { GithubMark } from "@/components/app-shell/github-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamplesGrid } from "@/components/examples/examples-grid";

const REPO_URL = "https://github.com/MuhammadKaifNazeer/reosion";

/**
 * Short teaser shown on the landing page. The real default project file is
 * longer; the hero only needs enough code to communicate the idea without
 * stretching the demo row.
 */
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

const FLOW_STEPS = [
  { icon: FileCode2, label: "Code", detail: "Animation.tsx" },
  { icon: Layers, label: "Motion", detail: "React + Motion" },
  { icon: MonitorPlay, label: "Preview", detail: "Instant sandbox" },
  { icon: Download, label: "Export", detail: "Local render" },
] as const;

const FEATURES = [
  {
    icon: FileCode2,
    title: "Code as the source of truth",
    detail:
      "No hidden scene files, no opaque project format. One React file defines the whole animation.",
  },
  {
    icon: Cpu,
    title: "Deterministic frame clock",
    detail:
      "Every frame renders at an exact timestamp. Frame 103 at 30fps is 3.433s, every single time.",
  },
  {
    icon: Download,
    title: "Local rendering",
    detail:
      "Frames render in a sandbox on your machine and are encoded locally. Nothing is uploaded.",
  },
  {
    icon: Unlock,
    title: "You own everything",
    detail:
      "Your code, your projects, your keys, your exports. Files stay with you — not with us.",
  },
  {
    icon: Sparkles,
    title: "AI that edits your code",
    detail:
      "Bring your own key. The assistant proposes structured edits you accept or reject in a diff view.",
  },
  {
    icon: Layers,
    title: "Familiar libraries",
    detail:
      "Use React, Tailwind, Framer Motion, SVG and Lucide icons. What you know already applies.",
  },
] as const;

const PIPELINE = [
  "Animation.tsx",
  "Local React runtime",
  "Live preview",
  "Deterministic renderer",
  "Local encoder",
  "Download",
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <div className="flex items-center gap-2 text-foreground">
            <Logo />
            <Wordmark />
          </div>
          <nav className="ml-4 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link
              className="transition-colors hover:text-foreground"
              href="/examples"
            >
              Examples
            </Link>
            <a
              className="transition-colors hover:text-foreground"
              href="#features"
            >
              Features
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#local-first"
            >
              Local-first
            </a>
            <a className="transition-colors hover:text-foreground" href="#ai">
              AI
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
            >
              <GithubMark />
              GitHub
            </Button>
            <Button render={<Link href="/dashboard" />}>
              Start creating
              <ArrowRight />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
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
                render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
              >
                <GithubMark />
                View GitHub
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
                <ArrowRight
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
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
                      <span
                        className="size-1.5 rounded-full bg-brand"
                        style={{
                          animation:
                            "reosion-demo-pulse 3s ease-in-out infinite",
                        }}
                      />
                      Live preview
                    </span>
                    <p
                      className="text-2xl font-semibold tracking-tight text-foreground"
                      style={{
                        animation:
                          "reosion-demo-title 6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                      }}
                    >
                      Motion, in React.
                    </p>
                    <div className="mt-3 h-[3px] w-24 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full w-full origin-left rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--brand), #a78bfa)",
                          animation:
                            "reosion-demo-underline 6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                        }}
                      />
                    </div>
                    <div className="relative mt-8 h-1 w-44 rounded-full bg-muted/30">
                      <div
                        className="absolute size-2.5 rounded-full bg-brand"
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          boxShadow: "0 0 12px var(--brand)",
                          animation:
                            "reosion-demo-dot 6s cubic-bezier(0.65, 0, 0.35, 1) infinite",
                        }}
                      />
                    </div>
                    <p
                      className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                      style={{
                        animation: "reosion-demo-caption 6s linear infinite",
                      }}
                    >
                      1920 × 1080 · 30fps · mp4
                    </p>
                  </div>
                  <div className="absolute inset-x-4 bottom-3 h-0.5 overflow-hidden rounded-full bg-muted/20">
                    <div
                      className="h-full w-full origin-left rounded-full bg-brand/70"
                      style={{
                        animation: "reosion-demo-progress 6s linear infinite",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {FLOW_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">
                    0{i + 1}
                  </span>
                  <step.icon className="size-5 text-foreground" aria-hidden />
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Examples */}
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
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/examples" />}
              >
                Show all
                <ArrowRight />
              </Button>
            </div>
            <div className="mt-10">
              <ExamplesGrid limit={6} />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              A developer tool for motion.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              No timelines to drag, no layers to wrangle. The editor is a code
              editor; the animation is your program.
            </p>
            <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="border-border bg-card">
                  <CardHeader>
                    <feature.icon className="size-4 text-brand" aria-hidden />
                    <CardTitle className="text-sm font-medium">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-5">
                      {feature.detail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent hidden />
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Local-first */}
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
                  <li
                    key={node}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <span className="text-muted-foreground">0{i + 1}</span>
                    <span className="text-foreground">{node}</span>
                    {i === PIPELINE.length - 1 ? (
                      <span className="ml-auto text-brand">
                        blob → download
                      </span>
                    ) : (
                      <ArrowRight
                        className="ml-auto size-3 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* AI */}
        <section id="ai" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Optional AI, your API key.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  &ldquo;Make the title slide in from the left.&rdquo; The
                  assistant reads your code, project settings and runtime
                  errors, then proposes a patch as a diff. Accept, reject, keep
                  typing. The product never depends on it — and it works with
                  OpenAI, Anthropic, Gemini or an OpenRouter model of your
                  choice.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 font-mono text-xs leading-6">
                <p className="text-muted-foreground">prompt</p>
                <p className="text-foreground">
                  &ldquo;Slide the title in from the left.&rdquo;
                </p>
                <div className="my-3 border-t border-border" />
                <p className="text-muted-foreground">proposed diff</p>
                <pre className="tracking-tight">
                  <code className="block text-foreground">
                    <span className="text-destructive">
                      - initial=&#123;&#123; opacity: 0 &#125;&#125;
                    </span>
                    {"\n"}
                    <span className="text-brand">
                      + initial=&#123;&#123; opacity: 0, x: -120 &#125;&#125;
                    </span>
                  </code>
                </pre>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-sm bg-brand px-2 py-0.5 text-[11px] text-brand-foreground">
                    Accept
                  </span>
                  <span className="rounded-sm border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    Reject
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Open a project. Write React. Press play.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Free, open source and running entirely on your machine.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" render={<Link href="/dashboard" />}>
                Start creating
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
              >
                <GithubMark />
                View on GitHub
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <span className="flex items-center gap-2 text-foreground">
            <Logo size={14} />
            Reosion
          </span>
          <span>Open source · Local-first · MIT</span>
        </div>
      </footer>
    </div>
  );
}
