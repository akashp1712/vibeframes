import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { updateClip } from "../mutations";
import { serialize } from "../serialize";
import { getComposition, setComposition } from "../store";

export function createUpdateClipTool() {
  return createTool({
    id: "update-clip",
    description:
      "Update an existing clip's HTML content, timing, or both. Returns the updated composition HTML.",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
      clipId: z.string().describe("ID of the clip to update"),
      html: z.string().optional().describe("Updated HyperFrames HTML"),
      startMs: z.number().optional().describe("New start time in milliseconds"),
      durationMs: z.number().optional().describe("New duration in milliseconds"),
    }),
    execute: async (args) => {
      const composition = getComposition(args.projectId);
      const updated = updateClip(composition, { ...args });
      setComposition(args.projectId, updated);

      return {
        clipId: args.clipId,
        compositionHtml: serialize(updated),
      };
    },
  });
}
