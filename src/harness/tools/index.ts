import type { HarnessServices } from "../services";
import { createGetCompositionTool } from "./get-composition";
import { createGetBlockSchemasTool } from "./get-block-schemas";
import { createGetTransitionSchemasTool } from "./get-transition-schemas";

/**
 * Director's tool registry (LLD-08).
 *
 * Read-only only. Mutation tools live in `tools-internal/` and are
 * accessed exclusively by the Compose subagent's `create-beat` /
 * `rebuild-beat` translator. The Director never mutates the composition
 * directly — it orchestrates subagents that do.
 *
 * The auto-injected `subagent` tool (provided by Mastra when the harness
 * declares `subagents: [...]`) is what the Director actually uses to
 * drive the pipeline; this registry is only the read-only inspection
 * surface for answering meta-questions and routing decisions.
 */
export function createHarnessTools(services: HarnessServices) {
  return {
    "get-composition": createGetCompositionTool(),
    "get-block-schemas": createGetBlockSchemasTool(services),
    "get-transition-schemas": createGetTransitionSchemasTool(services),
  };
}
