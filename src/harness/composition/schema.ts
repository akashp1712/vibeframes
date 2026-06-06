import { z } from "zod";

export const ClipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  html: z.string(),
});
export type Clip = z.infer<typeof ClipSchema>;

export const TrackSchema = z.object({
  id: z.string(),
  label: z.string(),
  clips: z.array(ClipSchema),
});
export type Track = z.infer<typeof TrackSchema>;

export const CompositionSchema = z.object({
  id: z.string(),
  title: z.string(),
  width: z.number().default(1920),
  height: z.number().default(1080),
  fps: z.number().default(30),
  tracks: z.array(TrackSchema),
});
export type Composition = z.infer<typeof CompositionSchema>;
