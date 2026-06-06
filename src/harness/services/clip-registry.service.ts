import type { ClipRegistryService, HyperFramesBlock } from "./types";

/**
 * The HyperFrames block catalog.
 *
 * Each block is a pre-designed Tailwind HTML fragment with named `{{slot}}`
 * variables. The director agent picks a block (via `get-block-schemas`),
 * fills its `vars`, and emits the rendered HTML through `add-clip`.
 *
 * Catalog growth follows the learning roadmap (item 1, `docs/meta/future-roadmap.md`):
 * we add blocks deliberately — each new one should cover a real scene-type
 * the agent currently has to invent from scratch.
 *
 * Discipline:
 *   - Every template starts with a fullscreen flex root (`h-full w-full`)
 *     UNLESS it's an overlay, which uses `absolute` positioning.
 *   - Every `{{var}}` slot in the template MUST appear in `vars`.
 *   - Every entry in `vars` MUST be referenced in the template.
 *   - No `<script>` tags. No fade-in/out (the renderer handles those).
 *
 * `kind` semantics:
 *   - `unit`        : atomic block designed to layer with peers on adjacent
 *                     tracks. Backgrounds, overlays, and decorative effects.
 *   - `composition` : self-contained full-scene block. One clip = one beat.
 *                     The agent reaches for these for quick legible scenes.
 */
const BLOCKS: HyperFramesBlock[] = [
  //
  // ── Tier 1a: atomic blocks of the canonical 3-clip pattern ───────────────
  // Evidence: `experiments/composition-preview/vercel-intro.html`. These
  // three layered atoms (bg / logo+title / subtitle) are what the agent
  // actually produces for product intros. Keep them at the top of the
  // catalog so they're the first thing the director sees.
  //
  {
    id: "background-fill",
    name: "Background Fill",
    category: "background",
    kind: "unit",
    description:
      "Full-screen background fill — solid colour or gradient. The atomic track-0 block; every composition starts with one to establish the canvas.",
    template: `<div class="{{bgClass}} h-full w-full"></div>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background utility class(es). Examples: 'bg-black', 'bg-slate-950', 'bg-neutral-950', 'bg-gradient-to-br from-slate-900 to-black', 'bg-gradient-to-br from-indigo-950 to-black'.",
        required: true,
      },
    ],
  },
  {
    id: "logo-headline",
    name: "Logo + Headline",
    category: "title",
    kind: "unit",
    description:
      "Brand logo above a centred headline. The canonical middle-track block — pair it with `background-fill` on track 0 and `subtitle-anchor` on track 2 to reproduce the vercel-intro pattern.",
    template: `<div class="flex h-full w-full flex-col items-center justify-center gap-8"><div class="relative"><div class="absolute -inset-3 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 blur-xl"></div><img src="{{logoUrl}}" alt="{{title}}" class="relative h-24 w-24 rounded-2xl bg-white/5 object-contain p-3 ring-1 ring-white/15 backdrop-blur-sm" /></div><h1 class="text-8xl font-extrabold tracking-tighter text-white drop-shadow-2xl">{{title}}</h1><div class="h-px w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div></div>`,
    vars: [
      {
        name: "logoUrl",
        description:
          "Absolute URL to the logo image (PNG, SVG, or WEBP). Square logos at ≥80×80 render best. e.g. 'https://vercel.com/favicon.ico'.",
        required: true,
      },
      { name: "title", description: "Brand or product name (1–4 words ideal)", required: true },
    ],
  },
  {
    id: "subtitle-anchor",
    name: "Subtitle (anchored)",
    category: "lower-third",
    kind: "unit",
    description:
      "A single tagline anchored to one edge. Use on track 2+ above a `logo-headline` or `background-fill`. Pick `anchor` to position top, bottom, or centre.",
    template: `<div class="flex h-full w-full {{anchor}} px-20 pb-20"><p class="max-w-3xl text-center text-3xl font-medium leading-relaxed text-slate-200/90 drop-shadow-lg [text-wrap:balance]">{{text}}</p></div>`,
    vars: [
      { name: "text", description: "Tagline or subtitle (single line, ≤10 words)", required: true },
      {
        name: "anchor",
        description:
          "Tailwind classes describing where the text sits inside the canvas. Use exactly one of: 'items-end justify-center' (bottom-centre — most common), 'items-start justify-center' (top-centre), 'items-center justify-center' (dead centre).",
        required: true,
      },
    ],
  },

  //
  // ── Tier 1b: single-clip composite blocks (one clip = one full scene) ────
  //
  {
    id: "hero-title",
    name: "Hero Title",
    category: "title",
    kind: "composition",
    description:
      "A large, centered hero title on a dark gradient. Use as the opening beat of an intro composition.",
    template: `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"><h1 class="text-7xl font-extrabold tracking-tighter text-white">{{title}}</h1></div>`,
    vars: [
      { name: "title", description: "The hero headline (1–4 words ideal)", required: true },
    ],
  },
  {
    id: "lower-third",
    name: "Lower Third",
    category: "lower-third",
    kind: "unit",
    description:
      "A professional lower-third banner anchored bottom-left. Use as an overlay on track 2+ above a background or scene.",
    template: `<div class="absolute bottom-10 left-10 flex flex-col justify-center rounded-xl border border-slate-700 bg-slate-900/80 p-6 backdrop-blur-md"><h2 class="text-4xl font-bold text-white">{{name}}</h2><p class="text-2xl text-slate-300">{{role}}</p></div>`,
    vars: [
      { name: "name", description: "Person's name or product name", required: true },
      { name: "role", description: "Their role / title / company", required: true },
    ],
  },
  {
    id: "split-screen",
    name: "Split Screen (text / image)",
    category: "scene",
    kind: "composition",
    description:
      "Two-column scene: heading + subheading on the left, accent panel on the right. Good for product reveals.",
    template: `<div class="flex h-full w-full bg-slate-950 text-white"><div class="relative flex flex-1 flex-col justify-center p-20"><div class="absolute left-20 top-1/2 -translate-y-1/2"><div class="mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"></div><h2 class="mb-6 text-6xl font-extrabold tracking-tighter leading-[1.05] [text-wrap:balance]">{{heading}}</h2><p class="max-w-lg text-2xl leading-relaxed text-slate-400 [text-wrap:balance]">{{subheading}}</p></div></div><div class="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-700"><div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),transparent_60%)]"></div><div class="relative text-[11rem] drop-shadow-2xl">{{accent}}</div></div></div>`,
    vars: [
      { name: "heading", description: "Main headline (short, ≤6 words)", required: true },
      { name: "subheading", description: "Supporting sentence (≤14 words)", required: true },
      {
        name: "accent",
        description:
          "A single emoji or short visual symbol shown on the right panel (e.g. ⚡, 🎯, ▲). Optional — empty string is fine.",
        required: false,
      },
    ],
  },
  {
    id: "cta-button",
    name: "Call To Action",
    category: "cta",
    kind: "composition",
    description:
      "A centered headline above a large pill button. Use as the closing beat of an intro composition to drive an action.",
    template: `<div class="flex h-full w-full flex-col items-center justify-center gap-10 bg-black"><h2 class="text-5xl font-bold tracking-tight text-white">{{headline}}</h2><div class="rounded-full bg-white px-12 py-5 text-2xl font-semibold tracking-tight text-black shadow-2xl">{{cta}}</div></div>`,
    vars: [
      { name: "headline", description: "Lead-in copy above the CTA (e.g. 'Ready to ship?')", required: true },
      { name: "cta", description: "Button label (action verb, 2–4 words)", required: true },
    ],
  },
  {
    id: "end-card",
    name: "End Card",
    category: "end",
    kind: "composition",
    description:
      "Closing card with brand wordmark + tagline + URL. Use as the final clip of a composition.",
    template: `<div class="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-950 to-black"><h1 class="text-8xl font-extrabold tracking-tighter text-white">{{brand}}</h1><p class="text-2xl font-medium text-slate-400">{{tagline}}</p><p class="mt-8 font-mono text-lg tracking-widest text-slate-500 uppercase">{{url}}</p></div>`,
    vars: [
      { name: "brand", description: "Brand or product name", required: true },
      { name: "tagline", description: "Short tagline (≤10 words)", required: true },
      { name: "url", description: "Domain or handle to display (no protocol)", required: true },
    ],
  },
  {
    id: "stats-callout",
    name: "Stat Callout",
    category: "stats",
    kind: "composition",
    description:
      "One giant number with an all-caps label underneath. Use to emphasise a single metric (e.g. user count, speed-up factor).",
    template: `<div class="flex h-full w-full flex-col items-center justify-center bg-black"><p class="text-[12rem] font-extrabold leading-none tracking-tighter text-white tabular-nums">{{number}}</p><p class="mt-6 text-2xl font-medium uppercase tracking-widest text-slate-400">{{label}}</p></div>`,
    vars: [
      { name: "number", description: "The headline figure (e.g. '10K+', '99.9%', '3×')", required: true },
      { name: "label", description: "Short caption underneath (e.g. 'developers shipping daily')", required: true },
    ],
  },
  {
    id: "quote-pull",
    name: "Pull Quote",
    category: "quote",
    kind: "composition",
    description:
      "A centred pull quote with attribution. Use for testimonials, mission statements, or thesis beats.",
    template: `<div class="flex h-full w-full flex-col items-center justify-center gap-10 bg-neutral-950 px-32 text-center"><p class="text-5xl font-medium leading-tight tracking-tight text-white">"{{quote}}"</p><p class="text-xl font-medium uppercase tracking-widest text-slate-500">— {{attribution}}</p></div>`,
    vars: [
      { name: "quote", description: "The quoted text (≤25 words for legibility)", required: true },
      { name: "attribution", description: "Who said it (name, role, or both)", required: true },
    ],
  },
  {
    id: "kinetic-words",
    name: "Kinetic Words",
    category: "title",
    kind: "composition",
    description:
      "Three large words on one line, with the middle word in an accent colour. Use back-to-back kinetic-words clips on the same track for a punchy staccato intro.",
    template: `<div class="flex h-full w-full items-center justify-center gap-8 bg-black"><span class="text-8xl font-extrabold tracking-tighter text-white">{{word1}}</span><span class="text-8xl font-extrabold tracking-tighter text-blue-400">{{word2}}</span><span class="text-8xl font-extrabold tracking-tighter text-white">{{word3}}</span></div>`,
    vars: [
      { name: "word1", description: "First word (white)", required: true },
      { name: "word2", description: "Second word (accent colour — the emphasis)", required: true },
      { name: "word3", description: "Third word (white)", required: true },
    ],
  },

  //
  // ── Tier 1c: social overlay units ────────────────────────────────────────
  // Small absolute-positioned overlays that layer on top of any scene to
  // signal social context (TikTok / IG / X / YouTube vibes). Each one is a
  // unit: pick the spot, pick the data, stack on track 3+.
  //
  {
    id: "social-avatar",
    name: "Social Avatar (with handle)",
    category: "social",
    kind: "unit",
    description:
      "Circular avatar + handle + display name, anchored top-left. Use to attribute a clip to a creator or brand persona. Track 3+ overlay.",
    template: `<div class="absolute top-10 left-10 flex items-center gap-4"><img src="{{avatarUrl}}" alt="{{handle}}" class="h-16 w-16 rounded-full border-2 border-white object-cover" /><div class="flex flex-col"><p class="text-xl font-bold text-white drop-shadow">{{displayName}}</p><p class="text-base font-medium text-slate-200 drop-shadow">@{{handle}}</p></div></div>`,
    vars: [
      { name: "avatarUrl", description: "Absolute URL to the avatar image (square, ≥64×64)", required: true },
      { name: "displayName", description: "Display name (e.g. 'Akash Panchal')", required: true },
      { name: "handle", description: "Handle without the leading @ (e.g. 'akashp1712')", required: true },
    ],
  },
  {
    id: "mention-card",
    name: "@Mention Card",
    category: "social",
    kind: "unit",
    description:
      "Floating mention card with @handle and a one-line tagline. Anchored bottom-right. Use to credit a collaborator or reference. Track 3+ overlay.",
    template: `<div class="absolute right-10 bottom-10 flex items-center gap-3 rounded-full border border-white/20 bg-black/60 px-6 py-3 backdrop-blur-md"><span class="text-2xl">@</span><div class="flex flex-col leading-tight"><p class="text-lg font-bold text-white">{{handle}}</p><p class="text-sm text-slate-300">{{tagline}}</p></div></div>`,
    vars: [
      { name: "handle", description: "Handle without the leading @ (e.g. 'vercel')", required: true },
      { name: "tagline", description: "One-line tagline (≤8 words)", required: true },
    ],
  },
  {
    id: "hashtag-pill",
    name: "#Hashtag Pill",
    category: "social",
    kind: "unit",
    description:
      "Single bold hashtag pill anchored bottom-centre. Use to tie a clip to a campaign or trend. Track 3+ overlay.",
    template: `<div class="absolute right-0 bottom-16 left-0 flex justify-center"><div class="rounded-full bg-white px-6 py-2 text-xl font-bold tracking-tight text-black shadow-lg">#{{tag}}</div></div>`,
    vars: [
      { name: "tag", description: "Hashtag without the leading # (e.g. 'shipfast')", required: true },
    ],
  },
  {
    id: "comment-bubble",
    name: "Comment Bubble",
    category: "social",
    kind: "unit",
    description:
      "Faux social-comment bubble with avatar, handle, and body. Anchored left-centre. Great for testimonial overlays on a product clip. Track 3+ overlay.",
    template: `<div class="absolute top-1/2 left-10 flex max-w-md -translate-y-1/2 items-start gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-2xl backdrop-blur-md"><img src="{{avatarUrl}}" alt="{{handle}}" class="h-10 w-10 rounded-full object-cover" /><div class="flex flex-col"><p class="text-sm font-bold text-white">@{{handle}}</p><p class="mt-1 text-base text-slate-200">{{body}}</p></div></div>`,
    vars: [
      { name: "avatarUrl", description: "Absolute URL to the avatar image (square, ≥40×40)", required: true },
      { name: "handle", description: "Commenter handle without the leading @", required: true },
      { name: "body", description: "Comment body (≤120 chars for legibility)", required: true },
    ],
  },
  {
    id: "like-counter",
    name: "Like / Engagement Counter",
    category: "social",
    kind: "unit",
    description:
      "Vertical stack of icon + count (heart, comment, share) anchored right-centre — the classic TikTok/Reels engagement column. Track 3+ overlay.",
    template: `<div class="absolute top-1/2 right-10 flex -translate-y-1/2 flex-col items-center gap-6"><div class="flex flex-col items-center"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md"><span class="text-2xl">❤</span></div><p class="mt-1 text-sm font-bold text-white drop-shadow">{{likes}}</p></div><div class="flex flex-col items-center"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md"><span class="text-2xl">💬</span></div><p class="mt-1 text-sm font-bold text-white drop-shadow">{{comments}}</p></div><div class="flex flex-col items-center"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md"><span class="text-2xl">↗</span></div><p class="mt-1 text-sm font-bold text-white drop-shadow">{{shares}}</p></div></div>`,
    vars: [
      { name: "likes", description: "Like count, formatted (e.g. '12.4K', '1.2M')", required: true },
      { name: "comments", description: "Comment count, formatted", required: true },
      { name: "shares", description: "Share count, formatted", required: true },
    ],
  },

  //
  // ── Tier 1d: follow CTAs (social-native conversion units) ────────────────
  //
  {
    id: "follow-button",
    name: "Follow Button",
    category: "follow",
    kind: "unit",
    description:
      "Bold pill 'Follow @handle' button anchored bottom-centre. Use as the closing beat of short-form social content. Track 3+ overlay.",
    template: `<div class="absolute right-0 bottom-24 left-0 flex justify-center"><div class="flex items-center gap-3 rounded-full bg-rose-500 px-8 py-4 text-2xl font-bold text-white shadow-2xl"><span>＋</span><span>Follow @{{handle}}</span></div></div>`,
    vars: [
      { name: "handle", description: "Handle to follow, without the leading @", required: true },
    ],
  },
  {
    id: "follow-arrow",
    name: "Follow Arrow (animated)",
    category: "follow",
    kind: "unit",
    description:
      "An animated arrow that points down-right toward the follow button (or any screen affordance). Anchored above the bottom-right corner. Track 3+ overlay. Uses Tailwind's `animate-bounce` for the pulse motion.",
    template: `<div class="absolute right-32 bottom-32 flex flex-col items-center gap-1"><p class="text-lg font-bold text-white uppercase drop-shadow">{{label}}</p><div class="animate-bounce text-5xl text-white drop-shadow">↘</div></div>`,
    vars: [
      { name: "label", description: "Short call-out above the arrow (e.g. 'Tap follow')", required: true },
    ],
  },

  //
  // ── Tier 1e: full-frame effect overlays ──────────────────────────────────
  // Cosmetic units that wash over the whole frame. Use them on a high track
  // index to add texture or grade without redrawing the scene below.
  //
  {
    id: "grain-overlay",
    name: "Film Grain Overlay",
    category: "effect-overlay",
    kind: "unit",
    description:
      "Full-frame film-grain texture with light vignette. Layer on the top-most track to give any scene a filmic feel. Cosmetic only — no copy.",
    template: `<div class="absolute inset-0 mix-blend-overlay opacity-40" style="background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%), url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.{{intensity}}%22/></svg>');"></div>`,
    vars: [
      {
        name: "intensity",
        description:
          "Grain intensity as a single digit 1–9 (interpolated into the SVG opacity). '4' is subtle, '7' is heavy.",
        required: true,
      },
    ],
  },
  {
    id: "scanlines-overlay",
    name: "Scanlines / CRT Overlay",
    category: "effect-overlay",
    kind: "unit",
    description:
      "Full-frame horizontal scanline overlay with subtle pulse — classic CRT vibe. Layer on the top-most track. Cosmetic only — no copy.",
    template: `<div class="animate-pulse pointer-events-none absolute inset-0 {{opacityClass}}" style="background-image: repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px);"></div>`,
    vars: [
      {
        name: "opacityClass",
        description:
          "Tailwind opacity class controlling how strong the scanlines look. Use one of: 'opacity-30' (subtle), 'opacity-50' (default), 'opacity-70' (strong).",
        required: true,
      },
    ],
  },
];

export function createClipRegistryService(): ClipRegistryService {
  return {
    getBlockSchemas: () => BLOCKS,
  };
}
