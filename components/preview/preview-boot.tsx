"use client";

import { use } from "react";

import { PreviewScreen } from "@/components/preview/preview-screen";

/**
 * Client boundary that resolves the dynamic `projectId` param inside the
 * Suspense boundary (required under Cache Components).
 */
export function PreviewBoot({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <PreviewScreen projectId={projectId} />;
}
