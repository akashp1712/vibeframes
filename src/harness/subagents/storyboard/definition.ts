import type { HarnessSubagent } from "@mastra/core/harness";
import { buildStoryboardPrompt } from "./prompt";
import { createStoryboardTools } from "./tools";
import type { HarnessServices } from "../../services";

/**
 * Storyboard subagent — phase 2 of the LLD-08 pipeline.
 *
 * Model: gpt-4o. Storyboard authoring is the most creatively-loaded
 * phase and is where shallow prompts produce "logo-headline x3" output.
 * Spending the extra tokens here pays off in beat variety and concept
 * specificity. Override with VIBEFRAMES_STORYBOARD_MODEL.
 *
 * Workspace skills: blocks. The Storyboard subagent needs to know what
 * blocks exist (so blockHints are real) but doesn't need to know
 * authoring rules — that's the Compose subagent's job.
 *
 * maxSteps: 6 — generous to allow get-block-schemas + draft + propose +
 * (optional) revise + commit + final reply, plus a retry budget.
 */
export function createStoryboardSubagent(services: HarnessServices): HarnessSubagent {
  return {
    id: "storyboard",
    name: "Storyboard",
    description:
      "Convert the committed brief into a 2-20 beat storyboard with concept-first " +
      "beats (shotType, cameraMove, techniques, blockHints, voCue, durationMs). " +
      "Beats sum to brief.durationMs ± 500ms. Phase 2 of the pipeline.",
    instructions: buildStoryboardPrompt(),
    tools: createStoryboardTools(services),
    defaultModelId: process.env.VIBEFRAMES_STORYBOARD_MODEL || "openai/gpt-4o",
    allowedWorkspaceTools: [], // skills loaded via tools, not workspace tools
    maxSteps: 6,
  };
}
