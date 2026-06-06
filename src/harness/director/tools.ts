/**
 * Director tool registry.
 *
 * Each tool's `execute` reads/writes harness state via requestContext,
 * so the Director can call them in any order — the workflow skill
 * drives ordering, and each commit-* tool guards against out-of-phase
 * calls (commit-storyboard refuses if state.brief is null, etc.).
 */
import { createCommitBriefTool } from "../tools/commit-brief";
import {
  createCommitStoryboardTool,
  createProposeStoryboardTool,
  createReviseBeatTool,
} from "../tools/storyboard-tools";
import {
  createCreateBeatTool,
  createFinishComposeTool,
  createGetStoryboardTool,
  createRebuildBeatTool,
} from "../tools/compose-tools";
import { createCheckStoryboardTool } from "../tools/check-storyboard";
import { createGetCompositionTool } from "../tools/get-composition";
import { createListBlocksTool } from "../tools/list-blocks";

import type { HarnessServices } from "../services";

export function createDirectorTools(services: HarnessServices) {
  return {
    "commit-brief": createCommitBriefTool(),
    "list-blocks": createListBlocksTool(services),
    "propose-storyboard": createProposeStoryboardTool(),
    "commit-storyboard": createCommitStoryboardTool(),
    "revise-beat": createReviseBeatTool(),
    "get-storyboard": createGetStoryboardTool(),
    "create-beat": createCreateBeatTool(services),
    "rebuild-beat": createRebuildBeatTool(services),
    "finish-compose": createFinishComposeTool(),
    "check-storyboard": createCheckStoryboardTool(),
    "get-composition": createGetCompositionTool(),
  };
}
