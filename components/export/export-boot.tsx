"use client";

import { use } from "react";

import { ExportScreen } from "@/components/export/export-screen";

/**
 * Client boundary that resolves the dynamic `projectId` param inside the
 * Suspense boundary (required under Cache Components).
 */
export function ExportBoot({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <ExportScreen projectId={projectId} />;
}
