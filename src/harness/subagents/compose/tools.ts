import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import {
  StoryboardSchema,
  type Beat,
  type Storyboard,
  type VibeFramesState,
} from "../../state";
import type { HarnessServices } from "../../services";
import { addClip, removeClip } from "../../composition/mutations";
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
 * Build the clips for one beat: translates, applies addClip mutations,
 * persists composition, returns the new clipIds. Pure-ish — only the
 * composition store is mutated; the storyboard's `built`/`clipIds`
 * update is the caller's responsibility (separate write so callers can
 * batch with other patches if they want).
 */
function emitBeatClips(opts: {
  projectId: string;
  beat: Beat;
  storyboard: Storyboard;
  brief: NonNullable<VibeFramesState["brief"]>;
  services: HarnessServices;
}) {
  const catalog = opts.services.clipRegistry.getBlockSchemas();
  const translation = translateBeat({
    beat: opts.beat,
    storyboard: opts.storyboard,
    brief: opts.brief,
    catalog,
  });

  let composition = getComposition(opts.projectId);
  const clipIds: string[] = [];
  for (const c of translation.clips) {
    composition = addClip(composition, {
      trackId: c.trackId,
      trackLabel: c.trackLabel,
      startMs: c.startMs,
      durationMs: c.durationMs,
      html: c.html,
    });
    const track = composition.tracks.find((t) => t.id === c.trackId);
    const newClip = track?.clips[track.clips.length - 1];
    if (newClip) clipIds.push(newClip.id);
  }
  setComposition(opts.projectId, composition);
  return { clipIds, translation, composition };
}

/**
 * Remove the existing clips of a beat from the composition. Tolerant of
 * partial state (some clipIds may already be gone) — only attempts to
 * remove clips that still exist.
 */
function removeBeatClips(projectId: string, clipIds: string[]) {
  let composition = getComposition(projectId);
  const existingIds = new Set(composition.tracks.flatMap((t) => t.clips.map((c) => c.id)));
  for (const id of clipIds) {
    if (!existingIds.has(id)) continue;
    composition = removeClip(composition, { clipId: id });
  }
  setComposition(projectId, composition);
  return composition;
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

      const { clipIds, translation, composition } = emitBeatClips({
        projectId: state.projectId,
        beat,
        storyboard: state.storyboard,
        brief: state.brief,
        services,
      });

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
 * `revise-beat` — patch a beat's metadata in storyboard state. Use this
 * to change blockHints, techniques, voCue, concept, shotType, or
 * cameraMove on an existing beat. After revising, call `rebuild-beat`
 * for the same index to re-emit clips with the new metadata.
 *
 * NOT allowed via this tool: index, durationMs, built, clipIds. Those
 * are structural — wrong beat count or duration drift means the
 * Storyboard subagent should re-run, not Compose.
 */
export function createReviseBeatTool() {
  return createTool({
    id: "revise-beat",
    description:
      "Patch a beat's metadata (blockHints, techniques, voCue, concept, shotType, cameraMove) " +
      "without re-emitting clips. Use this to swap a block hint or change a technique before " +
      "calling rebuild-beat. Cannot change index/durationMs/built/clipIds — those are " +
      "structural; if they're wrong the storyboard itself needs to change.",
    inputSchema: z.object({
      index: z.number().int().min(1),
      patch: z
        .object({
          concept: z.string().min(8).optional(),
          shotType: z
            .enum([
              "extreme-close",
              "close",
              "medium",
              "wide",
              "over-the-shoulder",
              "dutch-angle",
            ])
            .optional(),
          cameraMove: z
            .enum([
              "static",
              "dolly-in",
              "dolly-out",
              "push",
              "parallax",
              "orbit",
              "rack-focus",
            ])
            .optional(),
          techniques: z.array(z.string().min(2)).min(2).optional(),
          blockHints: z.array(z.string()).optional(),
          voCue: z.string().nullable().optional(),
        })
        .describe("Allowed-fields-only patch; merged shallow into the beat."),
    }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.storyboard) return { ok: false, error: "no storyboard committed" };
      const beat = state.storyboard.beats.find((b) => b.index === input.index);
      if (!beat) return { ok: false, error: `no beat with index ${input.index}` };

      const updated: Beat = { ...beat, ...input.patch };
      const updatedStoryboard: Storyboard = StoryboardSchema.parse({
        ...state.storyboard,
        beats: state.storyboard.beats.map((b) => (b.index === input.index ? updated : b)),
      });

      if (!ctx) return { ok: true, beat: updated, persisted: false };
      await ctx.setState({ storyboard: updatedStoryboard });
      return {
        ok: true,
        beat: updated,
        note: "Beat metadata revised. Call rebuild-beat to re-emit clips with the new spec.",
        persisted: true,
      };
    },
  });
}

/**
 * `rebuild-beat` — remove the existing clips of a beat and re-emit them
 * via the translator. Use after `revise-beat` (to apply the new
 * blockHints) or after a validation failure on the beat's clips
 * (consecutive-block-repeat, brand-color-presence, etc.).
 *
 * Idempotent: if the beat had no clips (rebuild on a never-built beat),
 * acts like create-beat.
 */
export function createRebuildBeatTool(services: HarnessServices) {
  return createTool({
    id: "rebuild-beat",
    description:
      "Remove the existing clips of one beat (by index) and re-emit them via the translator. " +
      "Use this after revise-beat to apply new blockHints, or to recover from a validation " +
      "issue on the beat's clips. Returns the new clipIds.",
    inputSchema: z.object({ index: z.number().int().min(1) }),
    execute: async (input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.brief) return { ok: false, error: "no brief committed" };
      if (!state.storyboard) return { ok: false, error: "no storyboard committed" };
      const beat = state.storyboard.beats.find((b) => b.index === input.index);
      if (!beat) return { ok: false, error: `no beat with index ${input.index}` };

      // Drop the beat's existing clips first.
      removeBeatClips(state.projectId, beat.clipIds);

      // Re-emit.
      const { clipIds, translation, composition } = emitBeatClips({
        projectId: state.projectId,
        beat,
        storyboard: state.storyboard,
        brief: state.brief,
        services,
      });

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
          blocksUsed: translation.clips.map((c) => c.blockId),
          persisted: false,
        };
      }
      await ctx.setState({ storyboard: updatedStoryboard });

      return {
        ok: true,
        beatIndex: input.index,
        clipIds,
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
    "revise-beat": createReviseBeatTool(),
    "rebuild-beat": createRebuildBeatTool(services),
    "finish-compose": createFinishComposeTool(),
  };
}
