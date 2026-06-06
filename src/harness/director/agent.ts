/**
 * Director — the single agent that runs the VibeFrames pipeline.
 *
 * One agent walks brief → storyboard → compose → validate inside ONE
 * conversation. Skills load once into the workspace and stay in prompt
 * cache across phases. See docs/architecture.md for the map.
 */
import { Agent } from "@mastra/core/agent";
import type { HarnessMode } from "@mastra/core/harness";
import { openai } from "@ai-sdk/openai";
import type { VibeFramesState } from "../state";
import type { HarnessServices } from "../services";
import { buildDirectorPrompt } from "./prompt";
import { createDirectorTools } from "./tools";

export function createDirectorMode(services: HarnessServices): HarnessMode<VibeFramesState> {
  const allTools = createDirectorTools(services);

  return {
    id: "director",
    name: "Director",
    default: true,
    agent: new Agent({
      id: "vibeframes-director",
      name: "VibeFrames Director",
      // Instructions are dynamic on state — they include the current
      // phase + state summary so the agent never has to guess.
      instructions: ({ requestContext }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const harnessCtx = (requestContext as any)?.get?.("harness") as
          | { state?: VibeFramesState }
          | undefined;
        return buildDirectorPrompt(harnessCtx?.state ?? null);
      },
      // All tools available at once. Mastra resolves dynamic tools
      // ONCE per sendMessage call, not per step within the generate()
      // loop — so we can't phase-gate at the dynamic-tools layer
      // (the agent would be locked into the brief-phase toolset even
      // after commit-brief advanced state). The WORKFLOW skill drives
      // ordering and each commit-* tool's execute() guards against
      // out-of-phase calls (commit-storyboard refuses if state.brief
      // is null, etc.). When Mastra ships prepareStep, switch back to
      // dynamic filtering — phase.ts has the derivation ready to wire.
      tools: allTools,
      // Default to gpt-4o-mini — the prompt + skills + tool schemas
      // can push past the 30k TPM cap on gpt-4o tier-1. Mini handles
      // the structured-output extraction at ~30s wall and ~$0.05/run.
      // Override via VIBEFRAMES_MODEL when on a higher tier.
      model: openai(process.env.VIBEFRAMES_MODEL || "gpt-4o-mini"),
    }),
  };
}
