import type { HarnessSubagent } from "@mastra/core/harness";
import { buildBriefPrompt } from "./prompt";
import { createBriefTools } from "./tools";

/**
 * Brief subagent — first phase of the LLD-08 pipeline. Loaded into the
 * Harness's `subagents` array; spawned by the Director via the auto-injected
 * `subagent` tool with `agentType: "brief"`.
 *
 * Model choice: gpt-4o-mini. The work is structured-output extraction with
 * tight discipline — mini does this well at a fraction of the cost of 4o.
 *
 * Workspace skills: NONE. The Brief subagent is concept extraction, not
 * authoring. It needs no knowledge of HyperFrames blocks, transitions, or
 * effects — keeping its prompt context minimal is the win here.
 */
export const briefSubagent: HarnessSubagent = {
  id: "brief",
  name: "Brief",
  description:
    "Extract the strategic brief (message, arc, audience, format, duration, narration) from " +
    "the user's prompt and commit it to harness state. The first phase of the video pipeline " +
    "— call this once before any storyboard or composition work.",
  instructions: buildBriefPrompt(),
  tools: createBriefTools(),
  defaultModelId: process.env.VIBEFRAMES_BRIEF_MODEL || "openai/gpt-4o-mini",
  // No skills loaded — Brief is intent extraction, not authoring.
  allowedWorkspaceTools: [],
  // Hard step cap — prevents runaway loops. 4 steps allows: 1 think,
  // 1 commit-brief, 1 retry on validation error, 1 final text.
  maxSteps: 4,
};
