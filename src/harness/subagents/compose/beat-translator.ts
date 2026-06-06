/**
 * Beat translator — converts a Beat (the concept/shot/technique structure
 * the Storyboard subagent produced) into concrete clip mutations against
 * the Composition tree.
 *
 * First-pass design (deterministic switch):
 *   1. Compute startMs from prior beats' durations.
 *   2. Pick a primary catalog block from beat.blockHints (or fall back by
 *      shotType + concept-keywords → block id).
 *   3. Substitute {{vars}} from beat.concept, brief.brand, and shot type.
 *   4. Emit: track-bg (background-fill), track-main (the picked block),
 *      and optionally track-overlay (lower-third / social-* if signals).
 *
 * The translator is intentionally simple in this first pass. It produces
 * coherent compositions for the common case (intro / demo / launch) and
 * lets the agent add overlays via blockHints. When the catalog grows past
 * what a switch can express, swap the body for a small LLM call inside
 * the tool — the function signature stays the same.
 */
import type { Brief, Beat, Storyboard } from "../../state";
import type { ClipRegistryService, HyperFramesBlock } from "../../services/types";

export interface BeatTranslation {
  /** Where in the timeline this beat lives. */
  startMs: number;
  /** The clips to add — each becomes one add-clip call. */
  clips: BeatClip[];
}

export interface BeatClip {
  trackId: string;
  trackLabel: string;
  startMs: number;
  durationMs: number;
  html: string;
  /** Block id we picked, for logging/validation. */
  blockId: string;
}

const TRACK_BG = "track-bg";
const TRACK_MAIN = "track-main";
const TRACK_OVERLAY = "track-overlay";

/**
 * Compute the global startMs for a beat — sum of prior beats' durations.
 * Beat indices are 1-based and sequential (validated by commit-storyboard).
 */
export function computeBeatStartMs(storyboard: Storyboard, beatIndex: number): number {
  return storyboard.beats
    .filter((b) => b.index < beatIndex)
    .reduce((acc, b) => acc + b.durationMs, 0);
}

/**
 * Pick a block from the catalog. Strategy:
 *   1. If blockHints has any catalog ids, pick the first match.
 *   2. Else, fall back by shotType + concept keywords.
 *   3. Else, default to background-fill (the safest no-op).
 */
function pickPrimaryBlock(
  beat: Beat,
  catalog: HyperFramesBlock[],
  storyboard: Storyboard,
): HyperFramesBlock {
  const byId = new Map(catalog.map((b) => [b.id, b]));

  // 1. blockHints first
  for (const hint of beat.blockHints) {
    const block = byId.get(hint);
    // Skip background-fill at this layer — it's the bg track, not the
    // main track. The translator adds it unconditionally.
    if (block && block.id !== "background-fill" && block.kind === "composition") {
      return block;
    }
  }
  // Try unit blocks too if no composition was hinted
  for (const hint of beat.blockHints) {
    const block = byId.get(hint);
    if (block && block.id !== "background-fill") return block;
  }

  // 2. Concept keyword routing — only when the keyword is a real signal,
  // not a vague match on shotType.
  const concept = beat.concept.toLowerCase();
  const stats = byId.get("stats-callout");
  const heroTitle = byId.get("hero-title");
  const kineticWords = byId.get("kinetic-words");
  const splitScreen = byId.get("split-screen");
  const cta = byId.get("cta-button");
  const endCard = byId.get("end-card");
  const quote = byId.get("quote-pull");

  // Stats-callout only when concept names a NUMBER explicitly.
  if (
    /\d+%|\d+x|\d+×|metric|callout/.test(concept) ||
    /\bstat(s|istic)?\b/.test(concept)
  ) {
    if (stats) return stats;
  }
  if (concept.includes("quote") || concept.includes("testimonial")) {
    if (quote) return quote;
  }
  if (concept.includes("cta") || concept.includes("call to action") || concept.includes("sign up")) {
    if (cta) return cta;
  }
  if (concept.includes("close") || concept.includes("end") || concept.includes("outro") || concept.includes("closer")) {
    if (endCard) return endCard;
  }
  if (concept.includes("staccato") || concept.includes("punchy") || concept.includes("kinetic")) {
    if (kineticWords) return kineticWords;
  }

  // 3. Position-aware fallback. The first and last beats in the
  // storyboard have natural roles (opener / closer) regardless of
  // shotType — surface those first so atmospheric "extreme-close"
  // openers don't all become stats-callout.
  const isFirst = beat.index === 1;
  const isLast = beat.index === storyboard.beats.length;
  if (isFirst && heroTitle) return heroTitle;
  if (isLast && endCard) return endCard;

  // 4. Shot-type fallback for middle beats.
  switch (beat.shotType) {
    case "extreme-close":
      return stats ?? heroTitle ?? catalog[0]!;
    case "close":
      return heroTitle ?? kineticWords ?? catalog[0]!;
    case "medium":
      return splitScreen ?? heroTitle ?? catalog[0]!;
    case "wide":
      return splitScreen ?? heroTitle ?? catalog[0]!;
    case "over-the-shoulder":
      return splitScreen ?? heroTitle ?? catalog[0]!;
    case "dutch-angle":
      return kineticWords ?? heroTitle ?? catalog[0]!;
  }
}

/**
 * Substitute vars in a template, returning the rendered HTML.
 * Missing optional vars fall back to defaults from the var spec; missing
 * required vars are filled with sensible placeholders so the tool never
 * fails on mid-pipeline incompleteness (the storyboard concept may not
 * carry every var literal).
 */
function renderBlock(block: HyperFramesBlock, vars: Record<string, string>): string {
  let html = block.template;
  for (const v of block.vars) {
    const value = vars[v.name] ?? v.defaultValue ?? defaultPlaceholder(v.name);
    // Replace ALL occurrences — vars can repeat in a template.
    html = html.split(`{{${v.name}}}`).join(value);
  }
  return html;
}

/** Last-resort fallback placeholders so renders never break on missing vars. */
function defaultPlaceholder(name: string): string {
  if (name === "bgClass") return "bg-slate-950";
  if (name === "anchor") return "items-end justify-center";
  if (name === "logoUrl") return "https://avatars.githubusercontent.com/u/14985020";
  if (name === "title") return "Untitled";
  if (name === "text") return " ";
  if (name === "heading") return "Untitled";
  if (name === "subheading") return " ";
  if (name === "accent") return "✦";
  if (name === "headline") return "Get started";
  if (name === "cta") return "Try it";
  if (name === "brand") return "Brand";
  if (name === "tagline") return " ";
  if (name === "url") return "example.com";
  if (name === "number") return "100";
  if (name === "label") return " ";
  if (name === "quote") return " ";
  if (name === "attribution") return " ";
  if (name === "word1") return "Build";
  if (name === "word2") return "Fast";
  if (name === "word3") return "Now";
  if (name === "name") return " ";
  if (name === "role") return " ";
  return " ";
}

/**
 * Compute a sensible bgClass from the brand. Picks a tonally appropriate
 * Tailwind gradient.
 */
function bgClassForBrand(brief: Brief): string {
  const style = (brief.styleNotes ?? "").toLowerCase();
  if (style.includes("dark") || style.includes("cinematic") || style.includes("noir")) {
    return "bg-gradient-to-br from-slate-950 via-slate-900 to-black";
  }
  if (style.includes("warm") || style.includes("sunset")) {
    return "bg-gradient-to-br from-amber-900 via-rose-950 to-slate-950";
  }
  if (style.includes("playful") || style.includes("bright") || style.includes("punchy")) {
    return "bg-gradient-to-br from-indigo-700 via-fuchsia-700 to-amber-600";
  }
  // Neutral default tuned for most briefs.
  return "bg-gradient-to-br from-slate-900 to-black";
}

/**
 * Strict allowlist for brand color values. We accept short / standard
 * hex codes only (3, 4, 6, or 8 hex digits with a leading #).
 *
 * Why so strict: the value is interpolated into an inline `style="..."`
 * attribute and concatenated into HTML. A loose validator (e.g. "any
 * css color" or rgb(...)) would let crafted input break out of the
 * attribute or the CSS context. Even though the brief comes from the
 * LLM rather than the user directly, a prompt-injected brand value or a
 * future DESIGN.md import could feed an attacker-chosen string. Hex is
 * sufficient for what we render — keep it tight.
 */
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function safeHexColor(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : null;
}

/**
 * Build a brand-color accent overlay for the background clip. Renders a
 * subtle bottom-edge gradient bar in the brand's primaryColor — visible
 * enough to feel branded, not so loud it competes with the main content.
 *
 * Strict input validation: only hex colors are accepted. Anything else
 * (named colors, rgb(...), css variables, malformed values, attempted
 * attribute escapes) returns "" and the accent is skipped — defense
 * against the inline-style attribute being used as an injection vector.
 */
function brandAccent(brief: Brief): string {
  const color = safeHexColor(brief.brand.primaryColor);
  if (!color) return "";
  return (
    `<div class="absolute inset-x-0 bottom-0 h-1.5" ` +
    `style="background: linear-gradient(to right, transparent, ${color}, transparent);"></div>`
  );
}

/**
 * Project a beat's concept into vars for the picked primary block.
 *
 * Important: the beat's `concept` is the STORYBOARD'S internal
 * description for the agent ("Spark in darkness — moment before the
 * brand emerges") — it is NOT user-facing copy. Slicing it into
 * headline vars produces sentence fragments like "Spark in darkness —
 * moment before". The user sees that and rightly judges it as broken.
 *
 * Better strategy:
 *   - hero/title vars: prefer brand.name first, fall back to a
 *     headline-quality slice of brief.message (the value prop), then
 *     the beat's voCue (which the Storyboard skill instructs the
 *     agent to write as user-facing copy), then short concept.
 *   - tagline/subheading vars: prefer voCue, fall back to brief.message.
 *   - "label" / lower-third vars where the concept genuinely IS the
 *     description: keep the conceptShort.
 *
 * Real fix long-term: have the Storyboard subagent write `headline`
 * and `subheading` vars per beat alongside concept. But we don't have
 * those fields yet, so this heuristic gets us most of the way.
 */
function varsForBlock(block: HyperFramesBlock, beat: Beat, brief: Brief): Record<string, string> {
  const conceptShort = beat.concept.replace(/\.$/, "");
  const brandName = brief.brand.name ?? "Brand";
  const messageHeadline = headlineFromMessage(brief.message);
  const voCue = beat.voCue?.trim().replace(/\.$/, "") ?? "";

  switch (block.id) {
    case "hero-title":
      // Brand name → message headline → voCue → fallback. NEVER the raw
      // concept, which is internal storyboard prose.
      return {
        title: brandName !== "Brand" ? brandName : messageHeadline || voCue || "Hello",
      };

    case "kinetic-words": {
      // Three punchy words. Prefer voCue if it's short; else brand+verb+now.
      const source = voCue && voCue.split(/\s+/).length <= 6 ? voCue : messageHeadline;
      const words = source.split(/\s+/).slice(0, 3);
      while (words.length < 3) words.push("Now");
      return { word1: words[0]!, word2: words[1]!, word3: words[2]! };
    }

    case "stats-callout": {
      // The number must come from the concept (the agent put it there
      // intentionally). The label is the short concept.
      const num = extractNumber(conceptShort) ?? extractNumber(brief.message) ?? "10×";
      return {
        number: num,
        label: shortHeadline(conceptShort, 6),
      };
    }

    case "quote-pull":
      return {
        quote: voCue || brief.message,
        attribution: brandName,
      };

    case "split-screen":
      return {
        heading: messageHeadline || shortHeadline(brandName, 4),
        subheading: voCue || brief.message,
        accent: "✦",
      };

    case "cta-button":
      return {
        headline: voCue || messageHeadline,
        cta: brief.narration === "none" ? "Get started" : "Try it",
      };

    case "end-card":
      return {
        brand: brandName,
        tagline: brief.message,
        url: `${brandName.toLowerCase().replace(/\s+/g, "")}.com`,
      };

    case "logo-headline":
      return {
        logoUrl: "https://avatars.githubusercontent.com/u/14985020",
        title: brandName,
      };

    case "subtitle-anchor":
      return {
        text: conceptShort,
        anchor: "items-end justify-center",
      };

    case "lower-third":
      return { name: brandName, role: shortHeadline(conceptShort, 6) };

    default:
      // Best-effort: fill any var named in the schema with the concept short.
      return Object.fromEntries(
        block.vars.map((v) => [v.name, v.required ? shortHeadline(conceptShort, 6) : ""]),
      );
  }
}

/**
 * Distill a value-prop sentence into a headline-quality fragment.
 *
 * Rules:
 *   - Drop a leading subject if it's the brand name (so "Linear ships
 *     fast because it gets out of your way" → "ships fast").
 *   - Take up to 4-5 words.
 *   - Strip trailing punctuation.
 */
function headlineFromMessage(message: string): string {
  if (!message) return "";
  // Strip a leading "<word> verbs" pattern; keep the verb-phrase.
  // E.g. "Linear ships fast" → "ships fast"; "Stripe makes accepting payments simple" → "makes accepting payments"
  const words = message.replace(/[.!?]$/, "").split(/\s+/);
  if (words.length <= 4) return words.join(" ");
  // If the first word is uppercase (likely a brand), drop it.
  const first = words[0]!;
  const rest = /^[A-Z][a-zA-Z]+$/.test(first) && words.length > 4 ? words.slice(1) : words;
  return rest.slice(0, 4).join(" ");
}

function shortHeadline(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  return words.slice(0, maxWords).join(" ");
}

function extractNumber(text: string): string | null {
  const m = text.match(/(\d+(\.\d+)?[%xKkMm+×]?)/);
  return m ? m[0] : null;
}

/**
 * Translate a single beat into a sequence of clip mutations.
 * Pure function — no side effects, no harness state writes.
 */
export function translateBeat(opts: {
  beat: Beat;
  storyboard: Storyboard;
  brief: Brief;
  catalog: HyperFramesBlock[];
}): BeatTranslation {
  const { beat, storyboard, brief, catalog } = opts;
  const startMs = computeBeatStartMs(storyboard, beat.index);

  const bgClass = bgClassForBrand(brief);
  const bgBlock = catalog.find((b) => b.id === "background-fill")!;
  const primaryBlock = pickPrimaryBlock(beat, catalog, storyboard);

  // Wrap the bg HTML in a relative container so the brand accent overlay
  // can be absolutely positioned over it. Empty accent → wrapper still
  // works, just with no overlay.
  const accent = brandAccent(brief);
  const bgInner = renderBlock(bgBlock, { bgClass });
  const bgHtml = `<div class="relative h-full w-full">${bgInner}${accent}</div>`;

  const clips: BeatClip[] = [
    {
      trackId: TRACK_BG,
      trackLabel: "Background",
      startMs,
      durationMs: beat.durationMs,
      blockId: bgBlock.id,
      html: bgHtml,
    },
    {
      trackId: TRACK_MAIN,
      trackLabel: "Main",
      startMs,
      durationMs: beat.durationMs,
      blockId: primaryBlock.id,
      html: renderBlock(primaryBlock, varsForBlock(primaryBlock, beat, brief)),
    },
  ];

  // Optional overlay — only if a hint references one of the overlay
  // categories we know about.
  const overlayId = beat.blockHints.find((h) => {
    const block = catalog.find((b) => b.id === h);
    return (
      block &&
      (block.category === "lower-third" ||
        block.category === "social" ||
        block.category === "follow" ||
        block.category === "effect-overlay")
    );
  });
  if (overlayId) {
    const overlay = catalog.find((b) => b.id === overlayId)!;
    clips.push({
      trackId: TRACK_OVERLAY,
      trackLabel: "Overlay",
      startMs,
      durationMs: beat.durationMs,
      blockId: overlay.id,
      html: renderBlock(overlay, varsForBlock(overlay, beat, brief)),
    });
  }

  return { startMs, clips };
}

/** Convenience: translate every beat in a storyboard. */
export function translateStoryboard(opts: {
  storyboard: Storyboard;
  brief: Brief;
  registry: ClipRegistryService;
}): { beats: { beatIndex: number; translation: BeatTranslation }[] } {
  const catalog = opts.registry.getBlockSchemas();
  return {
    beats: opts.storyboard.beats.map((beat) => ({
      beatIndex: beat.index,
      translation: translateBeat({
        beat,
        storyboard: opts.storyboard,
        brief: opts.brief,
        catalog,
      }),
    })),
  };
}
