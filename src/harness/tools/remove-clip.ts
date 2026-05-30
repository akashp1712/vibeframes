import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { removeClip } from "../mutations";
import { serialize } from "../serialize";
import { getComposition, setComposition } from "../store";

export function createRemoveClipTool() {
  return createTool({
    id: "remove-clip",
    description: "Remove a clip from the composition. Removes the track if it becomes empty.",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
      clipId: z.string().describe("ID of the clip to remove"),
    }),
    execute: async (args) => {
      const composition = getComposition(args.projectId);
      const updated = removeClip(composition, { clipId: args.clipId });
      setComposition(args.projectId, updated);

      return {
        removedClipId: args.clipId,
        compositionHtml: serialize(updated),
        trackCount: updated.tracks.length,
        clipCount: updated.tracks.reduce((sum, t) => sum + t.clips.length, 0),
      };
    },
  });
}
