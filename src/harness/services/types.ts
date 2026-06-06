export interface ClipRegistryService {
  getBlockSchemas(): HyperFramesBlock[];
}

export interface TransitionRegistryService {
  getTransitionSchemas(): HyperFramesTransition[];
}

/**
 * A single template variable in a block or transition. The agent reads these
 * to know what copy/data to supply when filling a template. Declaring vars
 * explicitly (instead of inferring them from `{{slot}}` interpolation in the
 * template) means:
 *   - the agent gets typed hints in `get-block-schemas` / `get-transition-schemas`
 *   - we can validate before render that every required var is filled
 *   - future work (item 2 in the learning roadmap) can swap the LLM-emits-HTML
 *     path for an LLM-emits-{ block, vars } path with no schema rework
 */
export interface BlockVar {
  name: string;
  description: string;
  required: boolean;
  /**
   * Optional fallback used when the agent omits a required var. Lets small /
   * weak models keep moving instead of looping on the same arg-shape error.
   *
   * Discipline:
   *   - Only set this for *cosmetic* vars where a sensible neutral default
   *     still produces a watchable render (e.g. `bgClass: "bg-black"`,
   *     `anchor: "50% 50%"`).
   *   - DO NOT set it for *content* vars (headline copy, stats values, CTAs)
   *     — those should hard-fail so the agent is forced to make a creative
   *     choice instead of shipping placeholder text.
   *   - When the tool auto-fills a default it must surface a `note` in the
   *     result so the agent (and the journal) can see what happened.
   */
  defaultValue?: string;
}

/**
 * Block kind — distinguishes a single-purpose "unit" (atom that composes well
 * with others on adjacent tracks) from a self-contained "composition" (one
 * clip = one whole scene). The agent reaches for units when layering and
 * compositions when it wants a quick, opinionated beat.
 *
 *   - `unit`        : background-fill, logo-headline, subtitle-anchor,
 *                     lower-third, social overlays, effect overlays …
 *   - `composition` : hero-title, split-screen, stats-callout, quote-pull,
 *                     cta-button, end-card, kinetic-words …
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
   * Inner-body HTML (no outer `<div data-clip-id>` wrapper — `add-clip` adds
   * it). Tailwind classes only; CSS keyframes allowed inside, but no
   * `<script>`. Variable slots are written as `{{varName}}` and MUST match
   * one of the entries in `vars`.
   */
  template: string;
  vars: BlockVar[];
}

/**
 * A transition lives between two adjacent clips on the same track and shapes
 * how the first hands off to the second. Implemented transitions ship a
 * `template` that wraps a "cut-point" overlay clip (rendered on its own
 * `track-transition-*` track for the transition's window). Catalog-only
 * stubs (Tier 2/3) ship without a template — the agent can still see them
 * via `get-transition-schemas` but `add-transition` will refuse to emit one
 * until it's promoted.
 */
export type HyperFramesTransitionKind =
  | "cut"
  | "fade"
  | "slide"
  | "zoom"
  | "wipe"
  | "blur"
  | "morph"
  | "vfx";

export type HyperFramesTransitionTier = 1 | 2 | 3;

export interface HyperFramesTransition {
  id: string;
  name: string;
  description: string;
  kind: HyperFramesTransitionKind;
  /**
   * Tier 1: shipped (has `template`, ready to render).
   * Tier 2/3: catalog stub for the agent to plan toward; not yet implemented.
   */
  tier: HyperFramesTransitionTier;
  /** Suggested overlap window in ms when the agent calls `add-transition`. */
  defaultDurationMs: number;
  /**
   * Inner-body HTML rendered for the duration of the transition window.
   * Optional — Tier 2/3 entries omit this until they're promoted to Tier 1.
   * Same authoring rules as blocks (Tailwind only, no `<script>`, slots in
   * `{{varName}}` form referenced by `vars`).
   *
   * For `kind: "cut"` the template should be empty / not rendered; the
   * `add-transition` tool will treat it as a zero-duration boundary.
   */
  template?: string;
  vars: BlockVar[];
}

export interface HarnessServices {
  clipRegistry: ClipRegistryService;
  transitionRegistry: TransitionRegistryService;
}
