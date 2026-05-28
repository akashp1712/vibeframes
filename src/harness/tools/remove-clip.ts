import { z } from "zod";

export const removeClipTool = {
  description: "Remove a clip from the composition",
  parameters: z.object({
    clipId: z.string().describe("ID of the clip to remove"),
  }),
};
