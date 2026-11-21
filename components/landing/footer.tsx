import Link from "next/link";

import { Logo } from "@/components/app-shell/logo";
import { Badge } from "@/components/ui/badge";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row">
        <span className="flex items-center gap-2 text-foreground">
          <Logo size={14} />
          Reosion
          <Badge variant="secondary" className="text-[10px]">
            Beta
          </Badge>
        </span>
        <span>Open source · Local-first · MIT</span>
      </div>
    </footer>
  );
}