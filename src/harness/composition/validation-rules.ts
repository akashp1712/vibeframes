/**
 * Validation rules — pure functions over (storyboard, composition).
 *
 * Each rule returns ValidationIssue[]. Severity per LLD-08:
 *   error    → blocks delivery, triggers Compose retry
 *   warning  → ships, surfaced in final reply
 *   info     → silent
 *
 * Starter set (LLD-08 §"Validation rules"):
 *   1. beat-not-built          (error)
 *   2. clip-coverage           (error)
 *   3. duration-drift          (warning)
 *   4. consecutive-block-repeat(warning)
 *   5. brand-color-presence    (warning)
 *
 * Add rules empirically as we ship videos and notice patterns.
 */
import type { Brief, Storyboard, ValidationIssue } from "../state";
import type { Composition } from "./schema";

const DURATION_TOLERANCE_MS = 500;

export interface RuleContext {
  storyboard: Storyboard;
  composition: Composition;
  brief: Brief | null;
}

export type Rule = (ctx: RuleContext) => ValidationIssue[];

/** Every beat must have built === true. */
export const beatNotBuilt: Rule = ({ storyboard }) =>
  storyboard.beats
    .filter((b) => !b.built)
    .map((b) => ({
      severity: "error" as const,
      beatIndex: b.index,
      rule: "beat-not-built",
      message: `Beat ${b.index} has not been built — call create-beat for this index.`,
    }));

/** Every clipId in a beat must resolve to a real clip on the composition. */
export const clipCoverage: Rule = ({ storyboard, composition }) => {
  const allIds = new Set(composition.tracks.flatMap((t) => t.clips.map((c) => c.id)));
  const issues: ValidationIssue[] = [];
  for (const beat of storyboard.beats) {
    if (!beat.built) continue; // covered by beat-not-built
    if (beat.clipIds.length === 0) {
      issues.push({
        severity: "error",
        beatIndex: beat.index,
        rule: "clip-coverage",
        message: `Beat ${beat.index} is marked built but has no clipIds.`,
      });
      continue;
    }
    for (const id of beat.clipIds) {
      if (!allIds.has(id)) {
        issues.push({
          severity: "error",
          beatIndex: beat.index,
          rule: "clip-coverage",
          message: `Beat ${beat.index} references clip ${id} which is not in the composition.`,
        });
      }
    }
  }
  return issues;
};

/** Per-beat: actual clip span on track-main vs storyboard durationMs. */
export const durationDrift: Rule = ({ storyboard, composition }) => {
  const issues: ValidationIssue[] = [];
  for (const beat of storyboard.beats) {
    if (!beat.built || beat.clipIds.length === 0) continue;
    const beatClips = composition.tracks
      .flatMap((t) => t.clips)
      .filter((c) => beat.clipIds.includes(c.id));
    if (beatClips.length === 0) continue;
    const earliest = Math.min(...beatClips.map((c) => c.startMs));
    const latest = Math.max(...beatClips.map((c) => c.startMs + c.durationMs));
    const span = latest - earliest;
    if (Math.abs(span - beat.durationMs) > DURATION_TOLERANCE_MS) {
      issues.push({
        severity: "warning",
        beatIndex: beat.index,
        rule: "duration-drift",
        message: `Beat ${beat.index}: clip span ${span}ms vs storyboard ${beat.durationMs}ms (tolerance ±${DURATION_TOLERANCE_MS}ms).`,
      });
    }
  }
  return issues;
};

/**
 * Three or more adjacent beats use the same primary block. Catches the
 * canonical "logo-headline x3" anti-pattern. Looks at the FIRST clip on
 * track-main per beat (which the translator places).
 */
export const consecutiveBlockRepeat: Rule = ({ storyboard, composition }) => {
  // Find the primary block id for each beat by inspecting the first clip
  // on track-main. The translator's HTML doesn't carry block ids, so we
  // approximate by looking at distinctive markers in the rendered HTML.
  // Simple heuristic: hash the first 200 chars of html.
  const beatPrimary = storyboard.beats.map((b) => {
    if (!b.built || b.clipIds.length === 0) return { index: b.index, key: null as string | null };
    const mainTrack = composition.tracks.find((t) => t.id === "track-main");
    if (!mainTrack) return { index: b.index, key: null };
    const clip = mainTrack.clips.find((c) => b.clipIds.includes(c.id));
    if (!clip) return { index: b.index, key: null };
    return { index: b.index, key: clip.html.slice(0, 200) };
  });

  const issues: ValidationIssue[] = [];
  for (let i = 0; i + 2 < beatPrimary.length; i++) {
    const a = beatPrimary[i]!;
    const b = beatPrimary[i + 1]!;
    const c = beatPrimary[i + 2]!;
    if (a.key && a.key === b.key && b.key === c.key) {
      issues.push({
        severity: "warning",
        beatIndex: b.index,
        rule: "consecutive-block-repeat",
        message: `Beats ${a.index}, ${b.index}, ${c.index} appear to use the same primary block. Vary the visual language across consecutive beats.`,
      });
    }
  }
  return issues;
};

/**
 * If the brief specifies a brand primaryColor, at least 30% of clips
 * (across all beats) must include that color literal in their HTML.
 */
export const brandColorPresence: Rule = ({ composition, brief }) => {
  if (!brief?.brand.primaryColor) return [];
  const all = composition.tracks.flatMap((t) => t.clips);
  if (all.length === 0) return [];
  const colorLiteral = brief.brand.primaryColor.toLowerCase();
  const withColor = all.filter((c) => c.html.toLowerCase().includes(colorLiteral)).length;
  const ratio = withColor / all.length;
  if (ratio < 0.3) {
    return [
      {
        severity: "warning",
        beatIndex: null,
        rule: "brand-color-presence",
        message: `Only ${(ratio * 100).toFixed(0)}% of clips include the brand primaryColor (${brief.brand.primaryColor}). Aim for ≥30% to keep the composition feeling on-brand.`,
      },
    ];
  }
  return [];
};

export const allRules: Rule[] = [
  beatNotBuilt,
  clipCoverage,
  durationDrift,
  consecutiveBlockRepeat,
  brandColorPresence,
];

export function runAllRules(ctx: RuleContext): ValidationIssue[] {
  return allRules.flatMap((rule) => rule(ctx));
}
