/**
 * Shared types for the harness services layer.
 *
 * Today there is one service: `clipRegistry`. The transition registry
 * was deleted in M10 cleanup — the translator never consulted it and
 * the agent never planned transitions. When transitions return as a
 * real feature (see docs/meta/plan.md M-future), restore from git
 * history; the schema below is the starting shape.
 */

export interface ClipRegistryService {
  getBlockSchemas(): HyperFramesBlock[];
}

/**
 * A single template variable in a block. The agent reads these to know
 * what copy/data to supply when filling a template. Declaring vars
 * explicitly (instead of inferring them from `{{slot}}` interpolation
 * in the template) means:
 *   - the agent gets typed hints in `list-blocks`
 *   - we can validate before render that every required var is filled
 */
export interface BlockVar {
  name: string;
  description: string;
  required: boolean;
  /**
   * Optional fallback used when the agent omits a required var. Lets
   * small / weak models keep moving instead of looping on the same
   * arg-shape error.
   *
   * Discipline:
   *   - Only set this for *cosmetic* vars where a sensible neutral
   *     default still produces a watchable render
   *     (e.g. `bgClass: "bg-black"`, `anchor: "50% 50%"`).
   *   - DO NOT set it for *content* vars (headline copy, stats values,
   *     CTAs) — those should hard-fail so the agent is forced to make
   *     a creative choice instead of shipping placeholder text.
   *   - When the tool auto-fills a default it must surface a `note` in
   *     the result so the agent (and the journal) can see what
   *     happened.
   */
  defaultValue?: string;
}

/**
 * Block kind — distinguishes a single-purpose "unit" (atom that
 * composes well with others on adjacent tracks) from a self-contained
 * "composition" (one clip = one whole scene). The agent reaches for
 * units when layering and compositions when it wants a quick,
 * opinionated beat.
 *
 *   - `unit`        : background-fill, logo-headline, subtitle-anchor,
 *                     lower-third, social overlays, effect overlays …
 *   - `composition` : hero-title, split-screen, stats-callout,
 *                     quote-pull, cta-button, end-card, kinetic-words …
 */
export type HyperFramesBlockKind = "unit" | "composition";

export type HyperFramesBlockCategory =
  | "background"
  | "title"
  | "lower-third"
  | "scene"
  | "cta"
  | "stats"
  | "quote"
  | "end"
  | "social"
  | "follow"
  | "effect-overlay";

export interface HyperFramesBlock {
  id: string;
  name: string;
  description: string;
  /** Human-friendly tag for grouping in the catalog UI / prompt. */
  category: HyperFramesBlockCategory;
  /** Whether this is an atomic unit or a full-scene composition. */
  kind: HyperFramesBlockKind;
  /**
   * Inner-body HTML (no outer `<div data-clip-id>` wrapper —
   * `add-clip` adds it). Tailwind classes only; CSS keyframes allowed
   * inside, but no `<script>`. Variable slots are written as
   * `{{varName}}` and MUST match one of the entries in `vars`.
   */
  template: string;
  vars: BlockVar[];
}

export interface HarnessServices {
  clipRegistry: ClipRegistryService;
}
