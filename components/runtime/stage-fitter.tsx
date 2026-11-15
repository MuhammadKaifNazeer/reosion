"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures its own box and hands children a scale factor that fits a stage of
 * the given pixel dimensions inside it. Shared by the workspace, the preview
 * page and any thumbnail capture surface.
 */
export function StageFitter({
  width,
  height,
  maxScale = 1,
  children,
}: {
  width: number;
  height: number;
  /** Cap on the fit factor (1 = never upscale past true pixel size). */
  maxScale?: number;
  children: (scale: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.25);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const factor = Math.min(rect.width / width, rect.height / height);
    setScale(Math.max(0.05, Math.min(factor, maxScale)));
  }, [width, height, maxScale]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      {children(scale)}
    </div>
  );
}
