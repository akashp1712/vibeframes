import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { setComposition } from "../composition/store";
import { createEmptyComposition } from "../composition/mutations";

/**
 * Wipe the timeline back to empty. The Director calls this before rebuilding
 * when the user asks to change, redo, or replace the video — so edits produce
 * a clean composition instead of stacking new clips onto the old ones.
 */
export function createClearCompositionTool() {
  return createTool({
    id: "clear-composition",
    description:
      "Remove all clips and start the video over. Call this FIRST whenever the " +
      "user asks to change, redo, replace, or restructure the video — then rebuild " +
      "with add-clip. Don't call it for a purely additive request.",
    inputSchema: z.object({}),
    execute: async (_args, context) => {
      const projectId = context?.requestContext?.get("projectId") as string | undefined;
      if (!projectId) throw new Error("Missing projectId in request context");
      const empty = createEmptyComposition();
      setComposition(projectId, empty);
      return { ok: true, clipCount: 0, composition: empty };
    },
  });
}
