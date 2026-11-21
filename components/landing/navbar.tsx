
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo, Wordmark } from "@/components/app-shell/logo";
import { GithubMark } from "@/components/app-shell/github-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";
import { LandingMobileMenu } from "@/components/landing/mobile-menu";

const REPO_URL = "https://github.com/MuhammadKaifNazeer/reosion";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-6 px-6 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-foreground">
          <Logo />
          <Wordmark />
          <Badge variant="secondary" className="text-[10px]">
            Beta
          </Badge>
        </Link>

        <nav className="ml-4 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link className="transition-colors hover:text-foreground" href="/examples">
            Examples
          </Link>
          <Link className="transition-colors hover:text-foreground" href="#features">
            Features
          </Link>
          <Link className="transition-colors hover:text-foreground" href="/#local-first">
            Local-first
          </Link>
          <Link className="transition-colors hover:text-foreground" href="#ai">
            AI
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LandingThemeToggle />
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

        <div className="ml-auto md:hidden">
          <LandingMobileMenu />
        </div>
      </div>
    </header>
  );
}
