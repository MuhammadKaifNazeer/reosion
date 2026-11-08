import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo, Wordmark } from "@/components/app-shell/logo";
import { GithubMark } from "@/components/app-shell/github-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Sign-in UI. The first release is fully local — no backend is required, so
 * this flow is intentionally thin and modular. A real identity provider can
 * slot in later without touching product pages.
 */
export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-6 py-10">
      <Link
        href="/"
        className="flex h-6 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to home
      </Link>

      <div className="mt-4 flex items-center gap-2 text-foreground">
        <Logo />
        <Wordmark />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Sign in to Reosion
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Projects are stored locally in your browser, so you can work without
        signing in any time.
      </p>

      <Button
        variant="outline"
        className="mt-6 w-full"
        render={<a href="/dashboard" />}
      >
        <GithubMark />
        Continue with GitHub
      </Button>
      <Button
        variant="outline"
        className="mt-2 w-full"
        render={<a href="/dashboard" />}
      >
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full" render={<a href="/dashboard" />}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
