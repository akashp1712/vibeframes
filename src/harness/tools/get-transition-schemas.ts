import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import type { HarnessServices } from "../services";

export function createGetTransitionSchemasTool(services: HarnessServices) {
  return createTool({
    id: "get-transition-schemas",
    description:
      "Fetch the catalog of HyperFrames transitions. Each entry includes a tier (1=shipped, 2/3=catalog stub), kind, default duration, and any required vars. Only Tier 1 transitions can be materialised via `add-transition`.",
    inputSchema: z.object({}),
    execute: async () => {
      const schemas = services.transitionRegistry.getTransitionSchemas();
      return schemas;
    },
  });
}
