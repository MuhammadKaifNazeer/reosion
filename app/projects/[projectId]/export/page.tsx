import { Suspense } from "react";

import { ExportBoot } from "@/components/export/export-boot";

export default async function ExportPage(
  props: PageProps<"/projects/[projectId]/export">,
) {
  // params stay unawaited so the static shell can prerender (see Cache
  // Components); the client resolves them inside the boundary.
  return (
    <Suspense fallback={<ExportFallback />}>
      <ExportBoot params={props.params} />
    </Suspense>
  );
}

function ExportFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" />
        Loading export…
      </div>
    </div>
  );
}
