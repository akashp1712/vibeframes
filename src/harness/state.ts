import { z } from "zod";

/**
 * Harness state — dead simple for v1. The composition itself lives in the
 * composition store (disk-backed); state just holds the project handle and
 * the YOLO flag. Add phases/brief/etc. back here later if we ever need them.
 */
export const VibeFramesStateSchema = z.object({
  projectId: z.string(),
  /** If true, tools execute without human approval (serverless-friendly). */
  yolo: z.boolean().default(true),
});

export type VibeFramesState = z.infer<typeof VibeFramesStateSchema>;

export function createInitialState(projectId: string, yolo: boolean = true): VibeFramesState {
  return { projectId, yolo };
}
