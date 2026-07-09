/**
 * Director tool registry — dead simple for v1.
 * The agent has exactly two tools: build a clip, and inspect what it built.
 */
import { createAddClipTool } from "../tools/add-clip";
import { createGetCompositionTool } from "../tools/get-composition";
import { createClearCompositionTool } from "../tools/clear-composition";

export function createDirectorTools() {
  return {
    "add-clip": createAddClipTool(),
    "get-composition": createGetCompositionTool(),
    "clear-composition": createClearCompositionTool(),
  };
}
