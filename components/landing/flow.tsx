import { ArrowRight } from "lucide-react";

import { FileCode2, Layers, MonitorPlay, Download } from "lucide-react";

const FLOW_STEPS = [
  { icon: FileCode2, label: "Code", detail: "Animation.tsx" },
  { icon: Layers, label: "Motion", detail: "React + Motion" },
  { icon: MonitorPlay, label: "Preview", detail: "Instant sandbox" },
  { icon: Download, label: "Export", detail: "Local render" },
] as const;

export function LandingFlow() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              <step.icon className="size-5 text-foreground" aria-hidden />
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}