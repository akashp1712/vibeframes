import { Agent } from "@mastra/core/agent";
import type { HarnessMode } from "@mastra/core/harness";
import type { VibeFramesState } from "../state";
import { buildDirectorPrompt } from "./prompt";
import { createHarnessTools } from "../tools";
import type { HarnessServices } from "../services";
import { openai } from "@ai-sdk/openai";
import { HARNESS_CONFIG } from "../config";

export function createDirectorMode(services: HarnessServices): HarnessMode<VibeFramesState> {
  return {
    id: "director",
    name: "Director",
    default: true,
    agent: new Agent({
      id: "vibeframes-director",
      name: "VibeFrames Director",
      instructions: () => buildDirectorPrompt(),
      // Single source of truth for the default model lives in
      // HARNESS_CONFIG.defaultModel so the statusbar can render the same
      // value the agent is actually using.
      model: openai(HARNESS_CONFIG.defaultModel),
      tools: createHarnessTools(services),
    }),
  };
}
