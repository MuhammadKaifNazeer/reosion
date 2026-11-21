import { Cpu, Download, FileCode2, Layers, Sparkles, Unlock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  { icon: FileCode2, title: "Code as the source of truth", detail: "No hidden scene files, no opaque project format. One React file defines the whole animation." },
  { icon: Cpu, title: "Deterministic frame clock", detail: "Every frame renders at an exact timestamp. Frame 103 at 30fps is 3.433s, every single time." },
  { icon: Download, title: "Local rendering", detail: "Frames render in a sandbox on your machine and are encoded locally. Nothing is uploaded." },
  { icon: Unlock, title: "You own everything", detail: "Your code, your projects, your keys, your exports. Files stay with you — not with us." },
  { icon: Sparkles, title: "AI that edits your code", detail: "Bring your own key. The assistant proposes structured edits you accept or reject in a diff view." },
  { icon: Layers, title: "Familiar libraries", detail: "Use React, Tailwind, Framer Motion, SVG and Lucide icons. What you know already applies." },
] as const;

export function LandingFeatures() {
  return (
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
                <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                <CardDescription className="text-xs leading-5">{feature.detail}</CardDescription>
              </CardHeader>
              <CardContent hidden />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}