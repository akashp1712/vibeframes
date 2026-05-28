import { z } from "zod";

export const updateClipTool = {
  description: "Update an existing clip's content or timing",
  parameters: z.object({
    clipId: z.string().describe("ID of the clip to update"),
    html: z.string().optional().describe("Updated HyperFrames HTML"),
    startMs: z.number().optional().describe("New start time in milliseconds"),
    durationMs: z.number().optional().describe("New duration in milliseconds"),
  }),
};
