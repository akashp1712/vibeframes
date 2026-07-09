/**
 * Director — the single agent that builds a VibeFrames video.
 * One agent, one structured tool. The system prompt is the whole brief.
 */
import { Agent } from "@mastra/core/agent";
import type { AgentControllerMode } from "@mastra/core/agent-controller";
import { openai } from "@ai-sdk/openai";
import { DIRECTOR_PROMPT } from "./prompt";
import { createDirectorTools } from "./tools";

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
      model: openai(process.env.VIBEFRAMES_MODEL || "gpt-4o-mini"),
    }),
  };
}
