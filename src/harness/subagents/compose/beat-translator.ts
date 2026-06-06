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

  // 2. Fallback by shot type
  const concept = beat.concept.toLowerCase();
  const stats = byId.get("stats-callout");
  const heroTitle = byId.get("hero-title");
  const kineticWords = byId.get("kinetic-words");
  const splitScreen = byId.get("split-screen");
  const cta = byId.get("cta-button");
  const endCard = byId.get("end-card");
  const quote = byId.get("quote-pull");

  if (concept.includes("number") || concept.includes("metric") || concept.includes("stat")) {
    if (stats) return stats;
  }
  if (concept.includes("quote") || concept.includes("testimonial")) {
    if (quote) return quote;
  }
  if (concept.includes("cta") || concept.includes("call to action") || concept.includes("sign up")) {
    if (cta) return cta;
  }
  if (concept.includes("close") || concept.includes("end") || concept.includes("outro")) {
    if (endCard) return endCard;
  }
  if (concept.includes("staccato") || concept.includes("punchy") || concept.includes("kinetic")) {
    if (kineticWords) return kineticWords;
  }

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
 * Build a brand-color accent overlay for the background clip. Renders a
 * subtle bottom-edge gradient bar in the brand's primaryColor — visible
 * enough to feel branded, not so loud it competes with the main content.
 *
 * Returning empty string when no primaryColor is set lets the caller
 * concatenate without conditional branching.
 */
function brandAccent(brief: Brief): string {
  const color = brief.brand.primaryColor;
  if (!color) return "";
  // Inline style so the literal hex appears in the rendered HTML — this
  // is what the brand-color-presence validation rule looks for. Tailwind
  // arbitrary-value classes like `bg-[#5E6AD2]` would also work but
  // depend on the runtime building Tailwind on the fly.
  return (
    `<div class="absolute inset-x-0 bottom-0 h-1.5" ` +
    `style="background: linear-gradient(to right, transparent, ${color}, transparent);"></div>`
  );
}

/**
 * Project a beat's concept into vars for the picked primary block.
 * Strategy: short, evocative copy derived from the concept and the brief.
 * Real LLM-generated copy belongs in the Storyboard prompt's voCue/concept;
 * here we just render what the storyboard already implies.
 */
function varsForBlock(block: HyperFramesBlock, beat: Beat, brief: Brief): Record<string, string> {
  const conceptShort = beat.concept.replace(/\.$/, "");
  const brandName = brief.brand.name ?? "Brand";

  switch (block.id) {
    case "hero-title":
      // Pull a 1-4 word headline from the concept (first dash-separated chunk
      // or first 4 words) — the Storyboard concept tends to lead with the idea.
      return { title: shortHeadline(conceptShort, 4) };

    case "kinetic-words": {
      const words = conceptShort.split(/\s+/).slice(0, 3);
      while (words.length < 3) words.push("Now");
      return { word1: words[0]!, word2: words[1]!, word3: words[2]! };
    }

    case "stats-callout":
      return {
        number: extractNumber(conceptShort) ?? "100×",
        label: shortHeadline(conceptShort, 6),
      };

    case "quote-pull":
      return {
        quote: conceptShort,
        attribution: brandName,
      };

    case "split-screen":
      return {
        heading: shortHeadline(conceptShort, 6),
        subheading: conceptShort,
        accent: "✦",
      };

    case "cta-button":
      return {
        headline: shortHeadline(conceptShort, 6),
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
  const primaryBlock = pickPrimaryBlock(beat, catalog);

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
