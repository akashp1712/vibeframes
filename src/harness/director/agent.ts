/**
 * Director — the single agent that builds a VibeFrames video.
 * One agent, one structured tool. The system prompt is the whole brief.
 */
import { Agent } from "@mastra/core/agent";
import type { AgentControllerMode } from "@mastra/core/agent-controller";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { HARNESS_CONFIG } from "../config";
import { DIRECTOR_PROMPT } from "./prompt";
import { createDirectorTools } from "./tools";

/** Select the AI SDK provider from the model ID, without a second env flag. */
export function directorModel(modelId = HARNESS_CONFIG.defaultModel) {
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  return openai(modelId);
}

export function createDirectorMode(): AgentControllerMode {
  return {
    id: "director",
    name: "Director",
    metadata: { default: true },
    agent: new Agent({
      id: "vibeframes-director",
      name: "VibeFrames Director",
      instructions: DIRECTOR_PROMPT,
      tools: createDirectorTools(),
      model: directorModel(),
    }),
  };
}
