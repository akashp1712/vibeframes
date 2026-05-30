import { z } from "zod";

export const VibeFramesStateSchema = z.object({
  projectId: z.string(),
  currentRunId: z.string().optional(),
  /** If true, disables tool approval — let tools execute without user gate. */
  yolo: z.boolean().default(true),
});

export type VibeFramesState = z.infer<typeof VibeFramesStateSchema>;

/**
 * Create initial state for a new thread.
 *
 * @param projectId - The project ID
 * @param yolo - If true, disables tool approval (default: true to allow tools to execute)
 */
export function createInitialState(projectId: string, yolo: boolean = true): VibeFramesState {
  return {
    projectId,
    yolo,
  };
}
