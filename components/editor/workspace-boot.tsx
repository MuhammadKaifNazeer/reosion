"use client";

import { use } from "react";

import { WorkspaceScreen } from "@/components/editor/workspace-screen";

/**
 * Client boundary that resolves the dynamic `projectId` param inside the
 * Suspense boundary (required under Cache Components).
 */
export function WorkspaceBoot({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <WorkspaceScreen projectId={projectId} />;
}
