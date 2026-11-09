import { Suspense } from "react";

import { WorkspaceBoot } from "@/components/editor/workspace-boot";

export default async function WorkspacePage(
  props: PageProps<"/projects/[projectId]">,
) {
  // params stay unawaited so the static shell can prerender (see Cache
  // Components); the client resolves them inside the boundary.
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceBoot params={props.params} />
    </Suspense>
  );
}

function WorkspaceFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" />
        Loading workspace…
      </div>
    </div>
  );
}
