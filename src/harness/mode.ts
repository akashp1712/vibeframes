import { Agent } from "@mastra/core/agent";
import type { HarnessMode } from "@mastra/core/harness";
import type { VibeFramesState } from "./state";
import { buildDirectorPrompt } from "./prompts";
import { createHarnessTools } from "./tools";
import type { HarnessServices } from "./services";
import { openai } from "@ai-sdk/openai";

export function createDirectorMode(services: HarnessServices): HarnessMode<VibeFramesState> {
  return {
    id: "director",
    name: "Director",
    default: true,
    agent: new Agent({
      id: "vibeframes-director",
      name: "VibeFrames Director",
      instructions: () => buildDirectorPrompt(),
      model: openai(process.env.VIBEFRAMES_MODEL || "gpt-4o-mini"),
      tools: createHarnessTools(services),
    }),
  };
}
