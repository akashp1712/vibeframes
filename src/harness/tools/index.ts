import type { HarnessServices } from "../services";
import { createAddClipTool } from "./add-clip";
import { createUpdateClipTool } from "./update-clip";
import { createRemoveClipTool } from "./remove-clip";
import { createGetCompositionTool } from "./get-composition";
import { createGetBlockSchemasTool } from "./get-block-schemas";

export function createHarnessTools(services: HarnessServices) {
  return {
    "add-clip": createAddClipTool(),
    "update-clip": createUpdateClipTool(),
    "remove-clip": createRemoveClipTool(),
    "get-composition": createGetCompositionTool(),
    "get-block-schemas": createGetBlockSchemasTool(services),
  };
}
