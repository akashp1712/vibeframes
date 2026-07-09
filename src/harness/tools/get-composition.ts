import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { getComposition } from "../composition/store";
import { totalFrames } from "../composition/mutations";

/** Inspect what's been built so far. */
export function createGetCompositionTool() {
  return createTool({
    id: "get-composition",
    description: "Get the current composition (all clips built so far). Call to inspect state.",
    inputSchema: z.object({}),
    execute: async (_args, context) => {
      const projectId = context?.requestContext?.get("projectId") as string | undefined;
      if (!projectId) throw new Error("Missing projectId in request context");
      const composition = getComposition(projectId);
      return {
        clipCount: composition.clips.length,
        totalFrames: totalFrames(composition),
        composition,
      };
    },
  });
}
