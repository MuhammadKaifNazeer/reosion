"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCode2 } from "lucide-react";

import type { Example } from "@/lib/examples";

function storageKey(slug: string) {
  return "reosion:example-thumb:" + slug;
}

export function ExampleCard({
  example,
  thumbnail: thumbnailProp,
}: {
  example: Example;
  thumbnail?: string | null;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(thumbnailProp ?? null);

  useEffect(() => {
    if (thumbnailProp) {
      setThumbnail(thumbnailProp);
      return;
    }
    try {
      const cached = localStorage.getItem(storageKey(example.slug));
      if (cached) setThumbnail(cached);
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => {
      try {
        const cached = localStorage.getItem(storageKey(example.slug));
        if (cached) setThumbnail(cached);
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [example.slug, thumbnailProp]);

  return (
    <li className="group">
      <Link
        href={"/examples/" + example.slug}
        className="block cursor-pointer overflow-hidden rounded-lg border border-border bg-card outline-none transition-colors hover:border-muted-foreground/40"
      >
        <div className="flex shrink-0 items-center justify-center overflow-hidden bg-[#09090b] aspect-[16/9] w-full">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={example.title + " preview frame"}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <FileCode2 className="size-8 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110" aria-hidden />
          )}
        </div>
        <div className="border-t border-border flex items-center gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{example.title}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {example.width}×{example.height} · {example.duration}s
            </p>
          </div>
        </div>
      </Link>
      {null}
    </li>
  );
}