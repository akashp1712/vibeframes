import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import {
  StoryboardSchema,
  BeatSchema,
  type Storyboard,
  type Beat,
  type VibeFramesState,
} from "../state";
import type { HarnessServices } from "../services";
import { createGetBlockSchemasTool } from "./get-block-schemas";

const DURATION_TOLERANCE_MS = 500;

type HarnessCtx = {
  getState: () => VibeFramesState;
  setState: (patch: Partial<VibeFramesState>) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHarnessCtx(context: any): HarnessCtx | undefined {
  return context?.requestContext?.get("harness");
}

/**
 * Validates that beat durations sum to brief.durationMs ± tolerance.
 * Returns null on success, an error message on failure.
 */
function validateDurationSum(storyboard: Storyboard, briefDurationMs: number): string | null {
  const sum = storyboard.beats.reduce((a, b) => a + b.durationMs, 0);
  if (Math.abs(sum - briefDurationMs) > DURATION_TOLERANCE_MS) {
    return (
      `beat durations sum to ${sum}ms but brief.durationMs is ${briefDurationMs}ms ` +
      `(tolerance ±${DURATION_TOLERANCE_MS}ms). Adjust per-beat durationMs so they sum correctly.`
    );
  }
  return null;
}

/**
 * Validates that beat indices are 1-based, sequential, and unique.
 */
function validateBeatIndices(storyboard: Storyboard): string | null {
  const indices = storyboard.beats.map((b) => b.index);
  const sorted = [...indices].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      return `beat indices must be 1..N sequentially. Got: [${indices.join(", ")}].`;
    }
  }
  return null;
}

/**
 * `propose-storyboard` lets the agent draft a storyboard before committing.
 * Same shape as commit but does NOT advance the pipeline. Used to iterate
 * if the model wants to think out loud (rare in YOLO mode but supported).
 */
export function createProposeStoryboardTool() {
  return createTool({
    id: "propose-storyboard",
    description:
      "Draft a storyboard without committing. Returns ok:true if it parses and " +
      "durations sum to brief.durationMs ± 500ms. Use only when you want to validate a draft " +
      "before committing — most turns should call commit-storyboard directly.",
    inputSchema: z.object({ storyboard: StoryboardSchema }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const briefDurationMs = ctx?.getState().brief?.durationMs;
      if (!briefDurationMs) {
        return { ok: false, error: "no brief committed yet — call commit-brief first" };
      }
      // Parse to apply Zod defaults (built:false, clipIds:[], etc).
      const storyboard = StoryboardSchema.parse(input.storyboard);
      const err = validateDurationSum(storyboard, briefDurationMs);
      if (err) return { ok: false, error: err };
      const idxErr = validateBeatIndices(storyboard);
      if (idxErr) return { ok: false, error: idxErr };
      return { ok: true, storyboard };
    },
  });
}

/**
 * `commit-storyboard` writes the storyboard to harness state. Validates:
 *   - schema parse (handled by Mastra at tool boundary)
 *   - duration sum within ±500ms of brief.durationMs
 *   - beat indices are 1..N sequential, no gaps, no duplicates
 */
export function createCommitStoryboardTool() {
  return createTool({
    id: "commit-storyboard",
    description:
      "Commit the storyboard to harness state. Beats' durationMs MUST sum to " +
      "brief.durationMs ± 500ms, and indices MUST be 1..N sequential. Returns " +
      "ok:true on success; ok:false with `error` describing the validation gap " +
      "on failure — fix and call again.",
    inputSchema: z.object({ storyboard: StoryboardSchema }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.brief) {
        return { ok: false, error: "no brief committed yet — call commit-brief first" };
      }

      const storyboard = StoryboardSchema.parse(input.storyboard);
      const durationErr = validateDurationSum(storyboard, state.brief.durationMs);
      if (durationErr) return { ok: false, error: durationErr };
      const idxErr = validateBeatIndices(storyboard);
      if (idxErr) return { ok: false, error: idxErr };

      if (!ctx) {
        return { ok: true, storyboard, persisted: false };
      }
      await ctx.setState({ storyboard });
      return { ok: true, storyboard, persisted: true };
    },
  });
}

/**
 * `revise-beat` patches a single beat without re-emitting the whole
 * storyboard. Re-validates the duration sum after the patch.
 */
export function createReviseBeatTool() {
  return createTool({
    id: "revise-beat",
    description:
      "Patch a single beat by index. The patch is shallow-merged. " +
      "Re-validates total beat duration after the patch. Use this for tweaks " +
      "(extend a beat, swap a technique) instead of re-committing the whole " +
      "storyboard.",
    inputSchema: z.object({
      index: z.number().int().min(1),
      patch: BeatSchema.partial(),
    }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.storyboard) {
        return { ok: false, error: "no storyboard committed — call commit-storyboard first" };
      }
      if (!state.brief) {
        return { ok: false, error: "no brief — call commit-brief first" };
      }

      const beats = state.storyboard.beats.map((b) =>
        b.index === input.index ? ({ ...b, ...input.patch } as Beat) : b,
      );
      if (!beats.some((b) => b.index === input.index)) {
        return { ok: false, error: `no beat with index ${input.index}` };
      }

      const updated: Storyboard = { ...state.storyboard, beats };
      const durationErr = validateDurationSum(updated, state.brief.durationMs);
      if (durationErr) return { ok: false, error: durationErr };

      if (!ctx) return { ok: true, storyboard: updated, persisted: false };
      await ctx.setState({ storyboard: updated });
      return { ok: true, storyboard: updated, persisted: true };
    },
  });
}

/**
 * Tool registry for the Storyboard subagent. Receives services so it can
 * also expose `get-block-schemas` for the agent to browse the catalog
 * while planning beats.
 */
export function createStoryboardTools(services: HarnessServices) {
  // Re-uses the Director's get-block-schemas factory so there's a single
  // source of truth for the catalog surface.
  return {
    "get-block-schemas": createGetBlockSchemasTool(services),
    "propose-storyboard": createProposeStoryboardTool(),
    "revise-beat": createReviseBeatTool(),
    "commit-storyboard": createCommitStoryboardTool(),
  };
}
