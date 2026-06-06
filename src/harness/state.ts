import { z } from "zod";

/**
 * Shot type — cinematographic framing for a beat. Picks from a closed set
 * lifted from `step-3-storyboard.md`. Forcing the choice kills the
 * "settled hold" / "centered card with margins" anti-patterns by
 * construction (no shot type encodes them).
 */
export const ShotTypeSchema = z.enum([
  "extreme-close",
  "close",
  "medium",
  "wide",
  "over-the-shoulder",
  "dutch-angle",
]);
export type ShotType = z.infer<typeof ShotTypeSchema>;

/**
 * Camera move — every beat must specify one. "static" exists for explicit
 * intent (e.g. extreme-close on a single number), but the prompt pushes
 * the agent to justify it.
 */
export const CameraMoveSchema = z.enum([
  "static",
  "dolly-in",
  "dolly-out",
  "push",
  "parallax",
  "orbit",
  "rack-focus",
]);
export type CameraMove = z.infer<typeof CameraMoveSchema>;

/**
 * Beat — a single scene in the storyboard. Concept-first: what does this
 * beat communicate, what shot is it, what camera move, what techniques
 * make it land. `built` and `clipIds` are populated by the Compose phase
 * via `create-beat`.
 */
export const BeatSchema = z.object({
  index: z.number().int().min(1),
  /** What this beat communicates — one sentence. Drives all visual choices. */
  concept: z.string().min(8),
  shotType: ShotTypeSchema,
  cameraMove: CameraMoveSchema,
  /**
   * 2+ free-text technique names ("staggered card entrance", "kinetic type",
   * "svg path draw"). The min(2) forces variety — a one-technique beat is
   * a slideshow frame, not a video beat.
   */
  techniques: z.array(z.string().min(2)).min(2),
  /**
   * Catalog block ids the agent intends to use. Read by the beat translator
   * during Compose phase. Free-text fallback allowed (translator falls back
   * to free-form HTML emission with a warning).
   */
  blockHints: z.array(z.string()).default([]),
  /** Narration line for this beat. Null when brief.narration === "none". */
  voCue: z.string().nullable().default(null),
  durationMs: z.number().int().min(500),
  /** Set to true once `create-beat` has wired this beat's clips. */
  built: z.boolean().default(false),
  /** Clip ids produced by `create-beat`. Used by Validate to verify coverage. */
  clipIds: z.array(z.string()).default([]),
});
export type Beat = z.infer<typeof BeatSchema>;

/**
 * Storyboard — the plan committed by the Storyboard subagent. Beats sum
 * to brief.durationMs ± 500ms (validated by `commit-storyboard`).
 */
export const StoryboardSchema = z.object({
  /**
   * Pacing choice — drives architecture downstream:
   *   fast      = stacked single-file beats with hard cuts
   *   moderate  = sub-comp per beat with CSS crossfades
   *   slow      = sub-comp with long crossfades
   *   arc       = mixed (fast peak in the middle)
   */
  rhythm: z.enum(["fast", "moderate", "slow", "arc"]),
  beats: z.array(BeatSchema).min(2).max(20),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;

/**
 * Validation issue — a single finding from a validation rule.
 *
 * Severity policy:
 *   error    → pipeline fails; Director should re-spawn Compose with the
 *              issues as guidance (max 2 retries before shipping with errors)
 *   warning  → ship anyway; surface in final reply
 *   info     → silent in reply but visible in the report
 */
export const ValidationIssueSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  beatIndex: z.number().int().nullable(),
  rule: z.string(),
  message: z.string(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidationReportSchema = z.object({
  ranAt: z.number(),
  issues: z.array(ValidationIssueSchema),
  pass: z.boolean(),
  /**
   * Number of times Compose has been retried for this run. Starts at 0;
   * Director increments before re-spawning Compose. Caps at 2 — third
   * failure ships with errors surfaced in the final reply.
   */
  attempts: z.number().int().min(0).default(0),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;

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
   * Strategic brief (LLD-08 phase 1). Set by the Brief subagent's
   * `commit-brief` tool. Null until the first phase of a turn completes.
   */
  brief: BriefSchema.nullable().default(null),
  /**
   * Storyboard (LLD-08 phase 2). Set by the Storyboard subagent's
   * `commit-storyboard` tool. Null until phase 2 completes.
   */
  storyboard: StoryboardSchema.nullable().default(null),
  /**
   * Validation report (LLD-08 phase 4). Set by the Validate subagent's
   * `check-storyboard` tool. Null until phase 4 has run at least once.
   */
  validationReport: ValidationReportSchema.nullable().default(null),
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
    storyboard: null,
    validationReport: null,
  };
}
