import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo, Wordmark } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sig-up UI (local-first; see the sign-in page notes). */
export default function SignUpPage() {
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
        Create an account
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Optional — the editor works fully without one.
      </p>

      <form className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full" render={<a href="/dashboard" />}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
