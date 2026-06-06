import type { HarnessSubagent } from "@mastra/core/harness";
import { buildComposePrompt } from "./prompt";
import { createComposeTools } from "./tools";
import type { HarnessServices } from "../../services";

/**
 * Compose subagent — phase 3 of the LLD-08 pipeline.
 *
 * Model: gpt-4o-mini. Compose is mechanical (call create-beat per beat in
 * order, then finish-compose). The translator does the creative work
 * inside create-beat, so the agent itself doesn't need a strong model.
 *
 * maxSteps: 25. A long storyboard (20 beats) needs 22 tool calls
 * (1 get-storyboard + 20 create-beat + 1 finish-compose). 25 leaves
 * a small retry budget.
 */
export function createComposeSubagent(services: HarnessServices): HarnessSubagent {
  return {
    id: "compose",
    name: "Compose",
    description:
      "Walk the committed storyboard and call create-beat per beat, then finish-compose. " +
      "Phase 3 of the pipeline — the actual clip emission step.",
    instructions: buildComposePrompt(),
    tools: createComposeTools(services),
    defaultModelId: process.env.VIBEFRAMES_COMPOSE_MODEL || "openai/gpt-4o-mini",
    allowedWorkspaceTools: [],
    maxSteps: 25,
  };
}
