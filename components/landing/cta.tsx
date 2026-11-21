import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubMark } from "@/components/app-shell/github-mark";

const REPO_URL = "https://github.com/MuhammadKaifNazeer/reosion";

export function LandingCTA() {
  return (
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
  );
}