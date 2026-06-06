import { notFound } from "next/navigation";
import { isValidProjectId } from "@/lib/project-id";
import { HARNESS_CONFIG } from "@/harness/config";
import { StudioClient } from "./studio-client";

/**
 * Server component for `/studio/[projectId]`. In Next 16, `params` is a
 * Promise — we await it here, validate the id (path-safety; the id becomes
 * a filename in `.data/compositions/`), and pass it as a plain prop to the
 * client shell. This avoids the `useParams()` null-on-first-render hazard
 * and keeps the dynamic segment trivially server-rendered.
 */
export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!isValidProjectId(projectId)) notFound();
  return <StudioClient projectId={projectId} model={HARNESS_CONFIG.defaultModel} />;
}
