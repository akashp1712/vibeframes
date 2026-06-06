import { z } from "zod";

/**
 * Brief — the strategic frame the user gave us. Captured by the Brief
 * subagent (LLD-08) before any storyboard or composition work happens.
 *
 * The brand fields are hooks for a future DESIGN.md import: when present,
 * Brief will fill them from the file; when absent, the agent infers them
 * (or leaves them undefined and the rest of the pipeline picks evocative
 * defaults).
 */
export const BriefSchema = z.object({
  /** The ONE thing this video must communicate, in one sentence. */
  message: z.string().min(8),
  /** Narrative shape that organizes the beats. */
  arc: z.enum(["problem-solution", "reveal", "demonstration", "vibe", "comparison"]),
  /** Who is watching and where. Free text — "engineering teams", "TikTok scrollers". */
  audience: z.string().min(3),
  /** Frame aspect / platform. */
  format: z.enum(["landscape", "portrait", "square"]),
  /** Total runtime in milliseconds. Drives storyboard beat-duration sum. */
  durationMs: z.number().int().min(5_000).max(120_000),
  /** Whether the agent should plan voiceover. */
  narration: z.enum(["full", "minimal", "none"]),
  /** Free-text style cues from the user — "dark cinematic", "punchy social". */
  styleNotes: z.string().optional(),
  /** Brand toolkit. Future DESIGN.md import fills these; otherwise inferred. */
  brand: z
    .object({
      name: z.string().optional(),
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .default({}),
});
export type Brief = z.infer<typeof BriefSchema>;

export const VibeFramesStateSchema = z.object({
  projectId: z.string(),
  currentRunId: z.string().optional(),
  /** If true, disables tool approval — let tools execute without user gate. */
  yolo: z.boolean().default(true),
  /**
   * Strategic brief (LLD-08). Set by the Brief subagent's `commit-brief`
   * tool. Null until the first phase of a turn completes.
   */
  brief: BriefSchema.nullable().default(null),
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
    brief: null,
  };
}
