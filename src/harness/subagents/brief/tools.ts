import { createTool } from "@mastra/core/tools";
import { BriefSchema, type VibeFramesState } from "../../state";
import { safeHexColor } from "../compose/beat-translator";
import { lookupBrand, DEFAULT_BRAND } from "../../brand-registry";

/**
 * `commit-brief` writes the strategic brief to harness state. The Brief
 * subagent's only tool — once the brief is committed, the subagent is done
 * and control returns to the Director.
 *
 * Mastra validates `input` against `inputSchema` before invoking `execute`,
 * so by the time we run, BriefSchema parse has already succeeded. We trust
 * the schema and simply persist.
 */
export function createCommitBriefTool() {
  return createTool({
    id: "commit-brief",
    description:
      "Commit the strategic brief: message, arc, audience, format, durationMs, narration. " +
      "Call exactly once after you've inferred or asked for every required field. " +
      "Returns ok:true and the committed brief on success.",
    inputSchema: BriefSchema,
    execute: async (input, context) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const harnessCtx = (context as any)?.requestContext?.get("harness") as
        | {
            getState: () => VibeFramesState;
            setState: (patch: Partial<VibeFramesState>) => Promise<void>;
          }
        | undefined;

      // Re-parse to apply Zod defaults (e.g. brand: {}).
      const parsed = BriefSchema.parse(input);
      // Resolve brand colors with three-tier fallback:
      //   1. Use the LLM's hex if it's clean (safeHexColor passes).
      //   2. If the LLM's value is malformed (e.g. "#5E6AD2}}" trailing
      //      garbage from a streaming-JSON glitch) BUT brand.name matches
      //      a known brand in our registry, use the canonical hex.
      //   3. If brand.name is unknown too, fall back to DEFAULT_BRAND
      //      (violet) so the validator's brand-color-presence rule
      //      always has something to find. The user can override with
      //      a follow-up edit.
      const known = lookupBrand(parsed.brand.name);
      const primaryColor =
        safeHexColor(parsed.brand.primaryColor) ??
        known?.primaryColor ??
        DEFAULT_BRAND.primaryColor;
      const accentColor =
        safeHexColor(parsed.brand.accentColor) ?? known?.accentColor;
      const brief = {
        ...parsed,
        brand: {
          ...parsed.brand,
          primaryColor,
          accentColor,
        },
      };

      if (!harnessCtx) {
        // No harness context — running in a unit test or detached. Return
        // the brief so the test can still assert on shape, but make it
        // explicit that nothing was persisted.
        return { ok: true, brief, persisted: false };
      }

      await harnessCtx.setState({ brief });
      return { ok: true, brief, persisted: true };
    },
  });
}

/**
 * Tool registry for the Brief subagent. Exported as a builder so we can
 * inject services later if/when commit-brief grows side effects beyond
 * harness state (e.g. emitting a `brief.committed` SSE event for the UI).
 */
export function createBriefTools() {
  return {
    "commit-brief": createCommitBriefTool(),
  };
}
