/**
 * Tool registry for the single-agent Director (LLD-08 v2).
 *
 * Re-exports the same tool factories the subagents use. The Director
 * gets ALL of them; phase-aware filtering happens via the Mastra
 * AgentConfig.tools dynamic argument (see director-single/agent.ts).
 *
 * Why re-use the subagent factories instead of redefining: each tool's
 * `execute` already reads/writes harness state via requestContext, so
 * the same tool works whether it's called by a subagent or by the
 * single-agent Director — there's no "subagent-specific" code in
 * them. Re-using preserves test coverage and avoids drift.
 */

import { createCommitBriefTool } from "../subagents/brief/tools";
import {
  createCommitStoryboardTool,
  createProposeStoryboardTool,
  createReviseBeatTool as createStoryboardReviseBeatTool,
} from "../subagents/storyboard/tools";
import {
  createCreateBeatTool,
  createFinishComposeTool,
  createGetStoryboardTool,
  createRebuildBeatTool,
  createReviseBeatTool as createComposeReviseBeatTool,
} from "../subagents/compose/tools";
import { createCheckStoryboardTool } from "../subagents/validate/tools";

import { createGetCompositionTool } from "../tools/get-composition";
import { createListBlocksTool } from "../tools/list-blocks";

import type { HarnessServices } from "../services";

export function createSingleAgentTools(services: HarnessServices) {
  return {
    "commit-brief": createCommitBriefTool(),
    "list-blocks": createListBlocksTool(services),
    "propose-storyboard": createProposeStoryboardTool(),
    "commit-storyboard": createCommitStoryboardTool(),
    // Storyboard's revise-beat patches storyboard metadata (concept,
    // techniques, blockHints) but doesn't re-emit clips. Compose's
    // revise-beat does the same patch. They're identical surfaces; we
    // expose Storyboard's variant under "revise-beat" because that's
    // the name both phases reach for.
    "revise-beat": createStoryboardReviseBeatTool(),
    "get-storyboard": createGetStoryboardTool(),
    "create-beat": createCreateBeatTool(services),
    "rebuild-beat": createRebuildBeatTool(services),
    // Compose's revise-beat is a superset (same patch, but allows the
    // caller to also rebuild). Expose under a separate key for cases
    // where the Compose subagent's prompt referenced it.
    "compose-revise-beat": createComposeReviseBeatTool(),
    "finish-compose": createFinishComposeTool(),
    "check-storyboard": createCheckStoryboardTool(),
    "get-composition": createGetCompositionTool(),
  };
}
