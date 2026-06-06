import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { serialize } from "../serialize";
import { getComposition } from "../composition-store";

export function createGetCompositionTool() {
  return createTool({
    id: "get-composition",
    description:
      "Get the current composition state and its serialized HyperFrames HTML. Call this to inspect what's already been built.",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
    }),
    execute: async (args) => {
      const composition = getComposition(args.projectId);

      return {
        compositionId: composition.id,
        title: composition.title,
        trackCount: composition.tracks.length,
        clipCount: composition.tracks.reduce((sum, t) => sum + t.clips.length, 0),
        tracks: composition.tracks.map((t) => {
          const trackEndMs = t.clips.reduce(
            (max, c) => Math.max(max, c.startMs + c.durationMs),
            0,
          );
          return {
            id: t.id,
            label: t.label,
            trackEndMs,
            clips: t.clips.map((c) => ({
              id: c.id,
              startMs: c.startMs,
              durationMs: c.durationMs,
              endMs: c.startMs + c.durationMs,
            })),
          };
        }),
        timelineEndMs: composition.tracks.reduce(
          (max, t) =>
            Math.max(max, t.clips.reduce((m, c) => Math.max(m, c.startMs + c.durationMs), 0)),
          0,
        ),
        compositionHtml: serialize(composition),
      };
    },
  });
}
