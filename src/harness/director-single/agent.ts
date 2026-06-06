/**
 * Single-agent Director (LLD-08 v2 spike).
 *
 * One agent per harness, no subagents. Phase-aware tool filtering via
 * Mastra's dynamic-tools mechanism: every LLM call resolves the tool
 * list from the current harness state. Tools the current phase doesn't
 * own are not sent to the model — same decision-narrowing benefit
 * subagents gave us, without the spawn overhead.
 *
 * Skills (workspace) load once and stay in cache across phases — this
 * is the prompt-caching win that makes single-agent cheaper than
 * subagents for our pipeline.
 */
import { Agent } from "@mastra/core/agent";
import type { HarnessMode } from "@mastra/core/harness";
import { openai } from "@ai-sdk/openai";
import type { VibeFramesState } from "../state";
import type { HarnessServices } from "../services";
import { HARNESS_CONFIG } from "../config";
import { buildDirectorPrompt } from "./prompt";
import { createSingleAgentTools } from "./tools";
import { derivePhase, PHASE_TOOLS } from "./phase";

type AllTools = ReturnType<typeof createSingleAgentTools>;

export function createSingleAgentMode(services: HarnessServices): HarnessMode<VibeFramesState> {
  const allTools = createSingleAgentTools(services);

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
      // All tools available at once. Mastra v1.37.1 resolves dynamic
      // tools ONCE per sendMessage call, not per step within the
      // generate() loop — so we can't phase-gate at the dynamic-tools
      // layer (the agent would be locked into the brief-phase toolset
      // even after commit-brief advanced state). Instead the WORKFLOW
      // skill drives ordering, and each tool's execute() guards
      // against being called out of phase (e.g. commit-storyboard
      // refuses if state.brief is null).
      //
      // Once Mastra ships prepareStep, switch back to dynamic
      // filtering — the phase derivation is in phase.ts ready to wire.
      tools: allTools,
      // Default to gpt-4o-mini for the spike — the prompt + skills +
      // tool schemas push past the 30k TPM cap on gpt-4o tier-1.
      // Override via VIBEFRAMES_MODEL or upgrade tier to use 4o.
      model: openai(process.env.VIBEFRAMES_MODEL || "gpt-4o-mini"),
    }),
  };
}
