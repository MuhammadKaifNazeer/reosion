"use client";

import { useEffect, useRef, useState } from "react";
import { AnimationClockController } from "@/lib/clock/clock";
import { PreviewRuntime } from "@/components/runtime/preview-runtime";
import { exampleToProject } from "@/lib/examples";
import { downscaleDataURL } from "@/lib/thumbnails/downscale";
import { bitmapToDataURL } from "@/lib/export/canvas";
import type { Example } from "@/lib/examples";

export function ThumbnailCapture({
  example,
  onCaptured,
}: {
  example: Example;
  onCaptured: (slug: string, dataUrl: string) => void;
}) {
  const project = exampleToProject(example);
  const clock = useRef(new AnimationClockController(example.duration, example.fps)).current;
  const [ready, setReady] = useState(false);
  const [captureRequested, setCaptureRequested] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const h = setTimeout(() => {
      clock.seek(0);
    }, 200);
    const h2 = setTimeout(() => {
      setCaptureRequested(true);
    }, 1200);
    return () => {
      clearTimeout(h);
      clearTimeout(h2);
    };
    return () => clearTimeout(h);
  }, [ready, clock, example.duration]);

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        width: 160,
        height: 90,
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <PreviewRuntime
        project={project}
        clock={clock}
        onRuntimeStatus={(s) => {
          if (s.kind === "ready") setReady(true);
        }}
        captureToken={captureRequested ? 1 : 0}
        onFrame={async (frame) => {
          if (doneRef.current) return;
          doneRef.current = true;
          setCaptureRequested(false);
          try {
            let dataURL = frame.dataURL;
            if (!dataURL && frame.bitmap) dataURL = await bitmapToDataURL(frame.bitmap);
            if (!dataURL) return;
            frame.bitmap?.close();
            const thumb = await downscaleDataURL(dataURL, 480, 0.8);
            try {
              localStorage.setItem("reosion:example-thumb:" + example.slug, thumb);
            } catch {
              /* ignore */
            }
            clock.seek(0);
            onCaptured(example.slug, thumb);
          } catch {
            /* ignore */
          }
        }}
      />
    </div>
  );
}