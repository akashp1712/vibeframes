import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { addClip } from "../mutations";
import { serialize } from "../serialize";
import { getComposition, setComposition } from "../composition-store";
import type { HarnessServices } from "../services";
import type { Clip } from "../types";

/**
 * `add-transition` materialises a transition between two adjacent clips on
 * the same source track. It does NOT mutate the source clips — instead it
 * adds a short overlay clip on a dedicated `track-transition` lane that
 * straddles the boundary.
 *
 * Timing logic (cut-point):
 *   - `cutMs` is the boundary point on the timeline (typically equal to the
 *     `startMs + durationMs` of the outgoing clip = `startMs` of the
 *     incoming clip).
 *   - The transition overlay clip is centred on `cutMs`: it starts at
 *     `cutMs - durationMs/2` and lasts `durationMs`.
 *   - For `kind: "cut"` (Tier 1) the transition is a logical no-op: the tool
 *     returns success without adding any clip. Useful so the agent can still
 *     "declare" a cut for journaling/eval.
 */
export function createAddTransitionTool(services: HarnessServices) {
  return createTool({
    id: "add-transition",
    description:
      "Add a transition between two clips on the same track. Creates a short overlay clip centred on the cut point on a dedicated transition track. Use `get-transition-schemas` first to pick a transition id.",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
      transitionId: z
        .string()
        .describe("The transition id from `get-transition-schemas` (e.g. 'fade-through-black')"),
      sourceTrackId: z
        .string()
        .describe("Track id where the two adjacent clips live (used to derive cutMs if not provided)"),
      cutMs: z
        .number()
        .optional()
        .describe(
          "Cut-point in ms on the timeline. If omitted, the tool picks the boundary between the last two clips on `sourceTrackId`.",
        ),
      durationMs: z
        .number()
        .optional()
        .describe(
          "Length of the transition window in ms. Defaults to the transition's `defaultDurationMs`.",
        ),
      vars: z
        .record(z.string(), z.string())
        .optional()
        .describe("Variable substitutions for the transition template (e.g. `{ bgClass: 'bg-black' }`)."),
    }),
    execute: async (args) => {
      const transitions = services.transitionRegistry.getTransitionSchemas();
      const transition = transitions.find((t) => t.id === args.transitionId);
      if (!transition) {
        throw new Error(
          `Unknown transition '${args.transitionId}'. Call \`get-transition-schemas\` to list available ids.`,
        );
      }

      if (transition.tier !== 1) {
        throw new Error(
          `Transition '${transition.id}' is a Tier ${transition.tier} catalog stub — it has no template yet. ` +
            `Pick a Tier 1 transition (e.g. 'cut', 'fade', 'fade-through-black', 'slide-left', 'zoom-in') or wait until it ships.`,
        );
      }

      const composition = getComposition(args.projectId);
      const sourceTrack = composition.tracks.find((t) => t.id === args.sourceTrackId);

      // Resolve cut point: explicit `cutMs` wins, otherwise derive from the
      // boundary between the last two clips on the source track.
      let cutMs = args.cutMs;
      if (cutMs === undefined) {
        if (!sourceTrack || sourceTrack.clips.length < 2) {
          throw new Error(
            `Cannot derive cut point: track '${args.sourceTrackId}' needs at least 2 clips when \`cutMs\` is omitted.`,
          );
        }
        const sorted: Clip[] = [...sourceTrack.clips].sort((a, b) => a.startMs - b.startMs);
        const second = sorted[sorted.length - 1];
        cutMs = second.startMs;
      }

      const durationMs = args.durationMs ?? transition.defaultDurationMs;

      // Cut transitions are logical-only — return success without adding a clip.
      if (transition.kind === "cut" || !transition.template || durationMs <= 0) {
        return {
          transitionId: transition.id,
          cutMs,
          durationMs: 0,
          note: "Cut transitions render as a hard boundary — no overlay clip added.",
          compositionHtml: serialize(composition),
          trackCount: composition.tracks.length,
          clipCount: composition.tracks.reduce((sum, t) => sum + t.clips.length, 0),
        };
      }

      // Substitute template vars with a forgiveness pattern: if a required
      // var has a registered `defaultValue` and the agent omits it (gpt-4o-mini
      // is prone to this — it sees the schema but still emits `vars: {}`),
      // auto-fill from the default and surface a `note` so the journal/eval
      // shows the assist. Only hard-fail when there's no default to fall back
      // on — that means a content-shaped var (headline, copy) the agent must
      // actually decide on.
      const vars: Record<string, string> = { ...(args.vars ?? {}) };
      const autoFilled: string[] = [];
      const missingNoDefault: string[] = [];
      for (const v of transition.vars) {
        if (!v.required || v.name in vars) continue;
        if (v.defaultValue !== undefined) {
          vars[v.name] = v.defaultValue;
          autoFilled.push(`${v.name}='${v.defaultValue}'`);
        } else {
          missingNoDefault.push(v.name);
        }
      }
      if (missingNoDefault.length > 0) {
        throw new Error(
          `Transition '${transition.id}' requires vars: ${missingNoDefault.join(", ")}. Pass them via the \`vars\` argument.`,
        );
      }
      const filledHtml = transition.template.replace(
        /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
        (_, name: string) => vars[name] ?? "",
      );

      // Place the overlay on a dedicated track so it never collides with the
      // source-track clips. Track id is namespaced by source so multiple
      // transitions across tracks can coexist.
      const transitionTrackId = `track-transition-${args.sourceTrackId}`;
      const transitionTrackLabel = `Transitions (${args.sourceTrackId})`;

      // Centre the overlay window on the cut point. Clamp `startMs` to 0 so
      // the boundary near the timeline start is still valid (the renderer
      // handles negative-clamped fades gracefully).
      const halfWindow = Math.floor(durationMs / 2);
      const overlayStartMs = Math.max(0, cutMs - halfWindow);

      const updated = addClip(composition, {
        trackId: transitionTrackId,
        trackLabel: transitionTrackLabel,
        startMs: overlayStartMs,
        durationMs,
        html: filledHtml,
      });
      setComposition(args.projectId, updated);

      const newClip = updated.tracks
        .flatMap((t) => t.clips)
        .find((c) => !composition.tracks.flatMap((t) => t.clips).some((oc) => oc.id === c.id));

      return {
        transitionId: transition.id,
        clipId: newClip?.id ?? "unknown",
        trackId: transitionTrackId,
        cutMs,
        startMs: overlayStartMs,
        durationMs,
        ...(autoFilled.length > 0
          ? {
              note: `Auto-filled missing var${autoFilled.length === 1 ? "" : "s"} from registry defaults: ${autoFilled.join(", ")}. Pass \`vars\` explicitly to override.`,
            }
          : {}),
        compositionHtml: serialize(updated),
        trackCount: updated.tracks.length,
        clipCount: updated.tracks.reduce((sum, t) => sum + t.clips.length, 0),
      };
    },
  });
}
