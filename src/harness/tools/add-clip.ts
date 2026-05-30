import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { addClip } from "../mutations";
import { serialize } from "../serialize";
import { getComposition, setComposition } from "../store";

export function createAddClipTool() {
  return createTool({
    id: "add-clip",
    description:
      "Add a new clip to a track in the composition. Creates the track if it doesn't exist. Returns the new clip ID and updated HTML.",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
      trackId: z.string().describe("Target track ID (e.g. 'track-main')"),
      trackLabel: z.string().optional().describe("Label for a new track (e.g. 'Background')"),
      startMs: z.number().describe("Start time in milliseconds"),
      durationMs: z.number().describe("Duration in milliseconds"),
      html: z.string().describe("HyperFrames HTML content for the clip"),
    }),
    execute: async (args) => {
      const composition = getComposition(args.projectId);

      // Defense against follow-up overlap: if the target track exists and the
      // requested startMs would overlap the latest clip on that track, snap to
      // the track's end. We surface the adjustment so the model can self-correct.
      const targetTrack = composition.tracks.find((t) => t.id === args.trackId);
      const trackEndMs = targetTrack
        ? targetTrack.clips.reduce((max, c) => Math.max(max, c.startMs + c.durationMs), 0)
        : 0;
      const requestedStartMs = args.startMs;
      const effectiveStartMs =
        targetTrack && requestedStartMs < trackEndMs ? trackEndMs : requestedStartMs;
      const startAdjusted = effectiveStartMs !== requestedStartMs;

      const updated = addClip(composition, { ...args, startMs: effectiveStartMs });
      setComposition(args.projectId, updated);

      const newClip = updated.tracks
        .flatMap((t) => t.clips)
        .find((c) => !composition.tracks.flatMap((t) => t.clips).some((oc) => oc.id === c.id));

      return {
        clipId: newClip?.id ?? "unknown",
        trackId: args.trackId,
        startMs: effectiveStartMs,
        startAdjusted,
        ...(startAdjusted && {
          note: `startMs ${requestedStartMs} overlapped existing clips on '${args.trackId}'; snapped to ${effectiveStartMs}.`,
        }),
        compositionHtml: serialize(updated),
        trackCount: updated.tracks.length,
        clipCount: updated.tracks.reduce((sum, t) => sum + t.clips.length, 0),
      };
    },
  });
}
