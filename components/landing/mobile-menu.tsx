
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Menu, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";
import { GithubMark } from "@/components/app-shell/github-mark";
import { Logo, Wordmark } from "@/components/app-shell/logo";

const REPO_URL = "https://github.com/MuhammadKaifNazeer/reosion";

const LINKS = [
  { label: "Examples", href: "/examples" },
  { label: "Features", href: "/#features" },
  { label: "Local-first", href: "/#local-first" },
  { label: "AI", href: "#ai" },
] as const;

export function LandingMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Navigation drawer */}
          <aside className="absolute inset-y-0 right-0 flex h-dvh w-[85vw] max-w-sm flex-col border-l border-border bg-background shadow-xl">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-foreground"
              >
                <Logo />
                <Wordmark />
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
              <p className="mb-3 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Navigation
              </p>

              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent/60"
                >
                  {link.label}
                  <ArrowRight className="size-4 text-muted-foreground opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              ))}
            </nav>

            {/* Footer actions */}
            <div className="mt-auto shrink-0 border-t border-border bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Appearance
                </span>
                <LandingThemeToggle />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  render={<Link href="/dashboard" />}
                  onClick={() => setOpen(false)}
                >
                  Start creating
                  <ArrowRight />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  render={
                    <a
                      href={REPO_URL}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <GithubMark />
                  GitHub
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
