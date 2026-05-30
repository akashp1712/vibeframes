import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import type { HarnessServices } from "../services";

export function createGetBlockSchemasTool(services: HarnessServices) {
  return createTool({
    id: "get-block-schemas",
    description: "Fetch the library of pre-designed HyperFrames HTML blocks styled with Tailwind.",
    inputSchema: z.object({}),
    execute: async () => {
      const schemas = services.clipRegistry.getBlockSchemas();
      return schemas;
    },
  });
}
