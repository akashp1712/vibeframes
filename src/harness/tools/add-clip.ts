import { z } from "zod";

export const addClipTool = {
  description: "Add a new clip to a track in the composition",
  parameters: z.object({
    trackId: z.string().describe("Target track ID"),
    startMs: z.number().describe("Start time in milliseconds"),
    durationMs: z.number().describe("Duration in milliseconds"),
    html: z.string().describe("HyperFrames HTML content for the clip"),
  }),
};
