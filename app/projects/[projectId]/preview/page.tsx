import { Suspense } from "react";

import { PreviewBoot } from "@/components/preview/preview-boot";

export default async function PreviewPage(
  props: PageProps<"/projects/[projectId]/preview">,
) {
  // params stay unawaited so the static shell can prerender (see Cache
  // Components); the client resolves them inside the boundary.
  return (
    <Suspense fallback={<PreviewFallback />}>
      <PreviewBoot params={props.params} />
    </Suspense>
  );
}

function PreviewFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" />
        Loading preview…
      </div>
    </div>
  );
}
