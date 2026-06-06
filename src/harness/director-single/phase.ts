/**
 * Pipeline phase derivation for the single-agent Director (LLD-08 v2).
 *
 * Phase is implicit in harness state — never stored as its own field.
 * Tools advance the phase by writing the next artifact: commit-brief
 * sets state.brief, which moves us out of "brief" phase, etc.
 *
 * Phases:
 *   brief       → no brief committed; only commit-brief is unlocked
 *   storyboard  → brief committed, no storyboard; planning tools unlock
 *   compose     → storyboard committed, beats not all built; build tools
 *   validate    → all beats built, no validation report yet
 *   done        → validation report exists with pass=true
 *   edit        → composition exists + user is asking a follow-up
 *                 (not derivable from state alone — handled by all-tools
 *                  fallback when state looks settled)
 */
import type { VibeFramesState } from "../state";

export type Phase = "brief" | "storyboard" | "compose" | "validate" | "done";

export function derivePhase(state: VibeFramesState | undefined | null): Phase {
  if (!state?.brief) return "brief";
  if (!state.storyboard) return "storyboard";
  const allBuilt = state.storyboard.beats.every((b) => b.built);
  if (!allBuilt) return "compose";
  if (!state.validationReport) return "validate";
  return "done";
}

/**
 * Tools available in each phase. Read-only tools (get-composition,
 * list-blocks, check-storyboard) are available across multiple phases
 * where useful. Mutation tools are gated to one phase each.
 */
export const PHASE_TOOLS: Record<Phase, readonly string[]> = {
  brief: ["commit-brief", "get-composition"],
  storyboard: [
    "list-blocks",
    "propose-storyboard",
    "commit-storyboard",
    "revise-beat",
    "get-composition",
  ],
  compose: [
    "get-storyboard",
    "create-beat",
    "rebuild-beat",
    "revise-beat",
    "finish-compose",
    "list-blocks",
    "get-composition",
  ],
  validate: ["check-storyboard", "get-composition"],
  // After done, all tools unlock for follow-up edits ("change beat 2's
  // hint to split-screen"). The Director's prompt handles the editing
  // workflow.
  done: [
    "list-blocks",
    "revise-beat",
    "rebuild-beat",
    "create-beat",
    "remove-beat",
    "check-storyboard",
    "finish-compose",
    "commit-storyboard",
    "commit-brief",
    "get-storyboard",
    "get-composition",
  ],
};
