import { redirect } from "next/navigation";
import { generateProjectId } from "@/lib/project-id";

// Force a fresh render per request — otherwise Next.js would statically
// prerender the redirect at build time, baking in a single random id and
// sending every "Open Studio" click to the same composition.
export const dynamic = "force-dynamic";

/**
 * `/studio` is a thin server component that mints a fresh project id and
 * redirects to `/studio/<id>`. Every "Open Studio" click yields a clean
 * composition; the URL is bookmarkable so the user can return to a specific
 * project later. The actual Studio UI lives at `/studio/[projectId]`.
 *
 * Side effects of this split:
 *   - One composition file per session under `.data/compositions/<id>.json`
 *     instead of a shared `default.json`.
 *   - The `add-clip` / `add-transition` tools read/write through the same
 *     projectId because the client passes it to `/api/chat` via `data`.
 *   - Use `pnpm clear-data` to wipe all sessions when iterating locally.
 */
export default function StudioIndexPage() {
  redirect(`/studio/${generateProjectId()}`);
}
