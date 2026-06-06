import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import type { HarnessServices } from "../services";

/**
 * `list-blocks` — slim variant of `get-block-schemas` for callers that
 * only need to PICK blocks (id + category + when-to-use), not render
 * them. Strips the large `template` HTML strings and the var
 * descriptions, which together make up ~80% of the catalog payload.
 *
 * Used during Storyboard planning. The translator (server-side) reads
 * the full catalog from services.clipRegistry, so it never needs this
 * tool over the wire.
 */
export function createListBlocksTool(services: HarnessServices) {
  return createTool({
    id: "list-blocks",
    description:
      "List available HyperFrames blocks (id, name, category, kind, description, var names only). " +
      "Use this when picking block ids for storyboard.beats[].blockHints. The full template HTML " +
      "is NOT returned — pick by id + description; the Compose phase renders the templates.",
    inputSchema: z.object({}),
    execute: async () => {
      const schemas = services.clipRegistry.getBlockSchemas();
      return schemas.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        kind: b.kind,
        description: b.description,
        varNames: b.vars.map((v) => v.name),
      }));
    },
  });
}
