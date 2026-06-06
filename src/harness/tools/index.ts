import type { HarnessServices } from "../services";
import { createAddClipTool } from "../tools-internal/add-clip";
import { createUpdateClipTool } from "../tools-internal/update-clip";
import { createRemoveClipTool } from "../tools-internal/remove-clip";
import { createAddTransitionTool } from "../tools-internal/add-transition";
import { createGetCompositionTool } from "./get-composition";
import { createGetBlockSchemasTool } from "./get-block-schemas";
import { createGetTransitionSchemasTool } from "./get-transition-schemas";

/**
 * Director's tool registry (LLD-08).
 *
 * After LLD-08 Slice B lands fully, the four mutation tools below should
 * be REMOVED from this list — only `create-beat` (in subagents/compose)
 * should call them, via tools-internal/. They remain registered here as a
 * transitional safety net while Compose is being built and validated;
 * once Compose ships and proves out, strip them from this file.
 *
 * What stays on the Director long-term:
 *   - get-composition
 *   - get-block-schemas
 *   - get-transition-schemas
 * The Director uses these for read-only inspection of the canvas when
 * answering meta-questions or making routing decisions.
 */
export function createHarnessTools(services: HarnessServices) {
  return {
    "add-clip": createAddClipTool(),
    "update-clip": createUpdateClipTool(),
    "remove-clip": createRemoveClipTool(),
    "add-transition": createAddTransitionTool(services),
    "get-composition": createGetCompositionTool(),
    "get-block-schemas": createGetBlockSchemasTool(services),
    "get-transition-schemas": createGetTransitionSchemasTool(services),
  };
}
