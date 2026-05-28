import { z } from "zod";

export const CompositionStatus = z.enum([
  "empty",
  "planning",
  "composing",
  "previewing",
  "exporting",
  "done",
]);
export type CompositionStatus = z.infer<typeof CompositionStatus>;

export const HarnessMode = z.enum(["plan", "vibe"]);
export type HarnessMode = z.infer<typeof HarnessMode>;

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

export const HarnessStateSchema = z.object({
  projectId: z.string(),
  mode: HarnessMode,
  status: CompositionStatus,
  composition: CompositionSchema.nullable(),
  plan: z.string().nullable(),
  error: z.string().nullable(),
});
export type HarnessState = z.infer<typeof HarnessStateSchema>;
