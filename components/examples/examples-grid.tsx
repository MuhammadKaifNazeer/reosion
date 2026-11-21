"use client";

import { useEffect, useState } from "react";
import { EXAMPLES } from "@/lib/examples";
import { ExampleCard } from "@/components/examples/example-card";
import { ThumbnailCapture } from "@/components/examples/thumbnail-capture";

export function ExamplesGrid({ limit }: { limit?: number }) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const ex of EXAMPLES) {
      try {
        const c = localStorage.getItem("reosion:example-thumb:" + ex.slug);
        if (c) initial[ex.slug] = c;
      } catch {
        /* ignore */
      }
    }
    setThumbs(initial);
  }, []);

  const list = typeof limit === "number" ? EXAMPLES.slice(0, limit) : EXAMPLES;
  const missing = list.find((ex) => !thumbs[ex.slug]);

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ex) => (
          <ExampleCard key={ex.slug} example={ex} thumbnail={thumbs[ex.slug] ?? null} />
        ))}
      </ul>
      {missing ? (
        <ThumbnailCapture
          key={missing.slug}
          example={missing}
          onCaptured={(slug, url) => {
            setThumbs((prev) => ({ ...prev, [slug]: url }));
          }}
        />
      ) : null}
    </>
  );
}