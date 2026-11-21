"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";
import { GithubMark } from "@/components/app-shell/github-mark";

const REPO_URL = "https://github.com/MuhammadKaifNazeer/reosion";

const LINKS = [
  { label: "Examples", href: "/examples" },
  { label: "Features", href: "#features" },
  { label: "Local-first", href: "#local-first" },
  { label: "AI", href: "#ai" },
] as const;

export function LandingMobileMenu() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* sheet */}
          <div
            className="mobile-sheet absolute right-0 top-0 flex h-full flex-col bg-background border-l border-border shadow-xl"
            style={{ width: "80%", maxWidth: "80vw" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <LandingThemeToggle />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mobile-sheet-scroll flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/60"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  render={<Link href="/dashboard" />}
                  onClick={() => setOpen(false)}
                >
                  Start creating
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  render={
                    <a href={REPO_URL} target="_blank" rel="noreferrer" />
                  }
                >
                  <GithubMark />
                  GitHub
                </Button>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}