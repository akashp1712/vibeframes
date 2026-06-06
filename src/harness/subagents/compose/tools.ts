import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import {
  StoryboardSchema,
  type Storyboard,
  type VibeFramesState,
} from "../../state";
import type { HarnessServices } from "../../services";
import { addClip } from "../../composition/mutations";
import { getComposition, setComposition } from "../../composition/store";
import { serialize } from "../../composition/serialize";
import { translateBeat } from "./beat-translator";

type HarnessCtx = {
  getState: () => VibeFramesState;
  setState: (patch: Partial<VibeFramesState>) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHarnessCtx(context: any): HarnessCtx | undefined {
  return context?.requestContext?.get("harness");
}

/**
 * `get-storyboard` — read-only inspector for the Compose subagent. Returns
 * the committed storyboard plus a quick "build progress" summary so the
 * agent knows what's left.
 */
export function createGetStoryboardTool() {
  return createTool({
    id: "get-storyboard",
    description: "Read the committed storyboard and report build progress.",
    inputSchema: z.object({}),
    execute: async (_input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.storyboard) {
        return { ok: false, error: "no storyboard committed" };
      }
      const beats = state.storyboard.beats;
      const built = beats.filter((b) => b.built).length;
      return {
        ok: true,
        storyboard: state.storyboard,
        progress: {
          totalBeats: beats.length,
          built,
          remaining: beats.length - built,
          remainingIndices: beats.filter((b) => !b.built).map((b) => b.index),
        },
      };
    },
  });
}

/**
 * `create-beat` — translates a single beat into clip mutations and writes
 * them to the composition tree. The atomic unit of progress in Compose
 * phase. Idempotent: re-running re-creates the beat (callers that need
 * delete-then-recreate semantics should use remove-beat first).
 */
export function createCreateBeatTool(services: HarnessServices) {
  return createTool({
    id: "create-beat",
    description:
      "Build the clips for one storyboard beat (specified by index). Reads the beat from " +
      "harness state, translates its shotType + blockHints + concept into composition " +
      "mutations, and writes them. Marks beat.built=true. Call once per beat in index order.",
    inputSchema: z.object({
      index: z.number().int().min(1).describe("1-based beat index"),
    }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.brief) return { ok: false, error: "no brief committed" };
      if (!state.storyboard) return { ok: false, error: "no storyboard committed" };

      const beat = state.storyboard.beats.find((b) => b.index === input.index);
      if (!beat) return { ok: false, error: `no beat with index ${input.index}` };

      const catalog = services.clipRegistry.getBlockSchemas();
      const translation = translateBeat({
        beat,
        storyboard: state.storyboard,
        brief: state.brief,
        catalog,
      });

      let composition = getComposition(state.projectId);
      const clipIds: string[] = [];

      for (const c of translation.clips) {
        composition = addClip(composition, {
          trackId: c.trackId,
          trackLabel: c.trackLabel,
          startMs: c.startMs,
          durationMs: c.durationMs,
          html: c.html,
        });
        // The newly-added clip is the last one on its track.
        const track = composition.tracks.find((t) => t.id === c.trackId);
        const newClip = track?.clips[track.clips.length - 1];
        if (newClip) clipIds.push(newClip.id);
      }
      setComposition(state.projectId, composition);

      // Update beat metadata.
      const updatedStoryboard: Storyboard = StoryboardSchema.parse({
        ...state.storyboard,
        beats: state.storyboard.beats.map((b) =>
          b.index === input.index ? { ...b, built: true, clipIds } : b,
        ),
      });

      if (!ctx) {
        return {
          ok: true,
          beatIndex: input.index,
          clipIds,
          startMs: translation.startMs,
          blocksUsed: translation.clips.map((c) => c.blockId),
          persisted: false,
        };
      }
      await ctx.setState({ storyboard: updatedStoryboard });

      return {
        ok: true,
        beatIndex: input.index,
        clipIds,
        startMs: translation.startMs,
        durationMs: beat.durationMs,
        blocksUsed: translation.clips.map((c) => c.blockId),
        compositionHtml: serialize(composition),
        clipCount: composition.tracks.reduce((sum, t) => sum + t.clips.length, 0),
        persisted: true,
      };
    },
  });
}

/**
 * `finish-compose` — marker tool. Returns ok:true if every beat is built.
 * Used by the agent as a "I'm done" signal — the Director reads it and
 * routes to Validate.
 */
export function createFinishComposeTool() {
  return createTool({
    id: "finish-compose",
    description:
      "Signal that every beat has been built. Returns ok:false with the missing " +
      "indices if any beat.built is still false — fix those first.",
    inputSchema: z.object({}),
    execute: async (_input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.storyboard) return { ok: false, error: "no storyboard committed" };
      const missing = state.storyboard.beats
        .filter((b) => !b.built)
        .map((b) => b.index);
      if (missing.length > 0) {
        return { ok: false, error: `unbuilt beats: ${missing.join(", ")}` };
      }
      return {
        ok: true,
        beatCount: state.storyboard.beats.length,
        totalDurationMs: state.storyboard.beats.reduce((a, b) => a + b.durationMs, 0),
      };
    },
  });
}

export function createComposeTools(services: HarnessServices) {
  return {
    "get-storyboard": createGetStoryboardTool(),
    "create-beat": createCreateBeatTool(services),
    "finish-compose": createFinishComposeTool(),
  };
}
