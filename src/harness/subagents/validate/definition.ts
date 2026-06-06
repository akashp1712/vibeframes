import type { HarnessSubagent } from "@mastra/core/harness";
import { buildValidatePrompt } from "./prompt";
import { createValidateTools } from "./tools";

/**
 * Validate subagent — phase 4 of the LLD-08 pipeline.
 *
 * Model: gpt-4o-mini. Runs one deterministic tool, summarizes a structured
 * report. Cheap.
 *
 * maxSteps: 3 — call check-storyboard, get the report, write one-line reply.
 */
export const validateSubagent: HarnessSubagent = {
  id: "validate",
  name: "Validate",
  description:
    "Run all validation rules against the committed storyboard + composition. " +
    "Phase 4 of the pipeline — final quality check before delivery.",
  instructions: buildValidatePrompt(),
  tools: createValidateTools(),
  defaultModelId: process.env.VIBEFRAMES_VALIDATE_MODEL || "openai/gpt-4o-mini",
  allowedWorkspaceTools: [],
  maxSteps: 3,
};
