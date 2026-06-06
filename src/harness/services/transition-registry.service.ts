import type { HyperFramesTransition, TransitionRegistryService } from "./types";

/**
 * The HyperFrames transition catalog.
 *
 * Transitions live between two adjacent clips on the same track. The agent
 * inspects this catalog via `get-transition-schemas`, picks a transition, and
 * calls `add-transition` to materialise it. Tier 1 entries ship a `template`
 * and render as a real overlay; Tier 2/3 entries are catalog stubs the agent
 * can plan toward but `add-transition` will refuse until they're promoted.
 *
 * Why a separate registry from clips?
 *   - Different lifecycle: transitions span *two* clips and a defined window.
 *   - Different authoring shape: most transitions are pure colour / motion
 *     overlays with no copy.
 *   - Different skill surface: `skills/transitions/skill.md` covers timing
 *     and tier-aware fallback, which the clip skill doesn't need.
 *
 * Discipline (Tier 1 entries):
 *   - `template` root must be a fullscreen overlay (`absolute inset-0` or
 *     `h-full w-full`) — transitions don't anchor.
 *   - No `<script>` tags. Use Tailwind animate utilities or inline `style`
 *     with CSS transforms.
 *   - Every `{{var}}` slot referenced in the template MUST appear in `vars`,
 *     and vice versa.
 *   - `kind: "cut"` entries have no `template` — they're just a logical
 *     boundary the agent can call out in planning.
 */
const TRANSITIONS: HyperFramesTransition[] = [
  //
  // ── Tier 1 (shipped) ─────────────────────────────────────────────────────
  //
  {
    id: "cut",
    name: "Hard Cut",
    description:
      "An instant boundary between two clips — no overlap, no overlay. Use as the baseline; reach for it when motion would distract.",
    kind: "cut",
    tier: 1,
    defaultDurationMs: 0,
    vars: [],
  },
  {
    id: "fade",
    name: "Cross-fade",
    description:
      "A simple opacity crossfade window. Renders a transparent overlay during the handoff so the underlying clips' built-in fades blend smoothly.",
    kind: "fade",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 bg-transparent"></div>`,
    vars: [],
  },
  {
    id: "fade-through-black",
    name: "Fade Through Black",
    description:
      "Briefly washes the frame to black between clips. Use for scene changes that should feel like a paragraph break.",
    kind: "fade",
    tier: 1,
    defaultDurationMs: 600,
    template: `<div class="absolute inset-0 animate-pulse bg-black"></div>`,
    vars: [],
  },
  {
    id: "fade-through-white",
    name: "Fade Through White",
    description:
      "Briefly washes the frame to white between clips. Use for upbeat brand moments or to mark a reveal.",
    kind: "fade",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 animate-pulse bg-white"></div>`,
    vars: [],
  },
  {
    id: "slide-left",
    name: "Slide Left",
    description:
      "Solid colour band that sweeps across the frame from right to left during the handoff. Use to feel like a horizontal page turn.",
    kind: "slide",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 {{bgClass}}" style="animation: vf-slide-left 0.5s ease-in-out forwards;"></div><style>@keyframes vf-slide-left { from { transform: translateX(100%); } to { transform: translateX(-100%); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the sweeping band. Examples: 'bg-black', 'bg-white', 'bg-rose-500'.",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    id: "slide-up",
    name: "Slide Up",
    description:
      "Solid colour band that sweeps across the frame from bottom to top during the handoff. Use for vertical-feed (social) compositions.",
    kind: "slide",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 {{bgClass}}" style="animation: vf-slide-up 0.5s ease-in-out forwards;"></div><style>@keyframes vf-slide-up { from { transform: translateY(100%); } to { transform: translateY(-100%); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the sweeping band. Examples: 'bg-black', 'bg-white', 'bg-indigo-600'.",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    id: "zoom-in",
    name: "Zoom In Flash",
    description:
      "Quick centred zoom-and-fade overlay that punches into the next clip. Use as a punctuation between dramatic beats.",
    kind: "zoom",
    tier: 1,
    defaultDurationMs: 400,
    template: `<div class="absolute inset-0 origin-center animate-ping bg-white"></div>`,
    vars: [],
  },
  {
    id: "zoom-out",
    name: "Zoom Out Flash",
    description:
      "Centred bloom that radiates outward then clears. Use to feel like a camera flash between still moments.",
    kind: "zoom",
    tier: 1,
    defaultDurationMs: 400,
    template: `<div class="absolute inset-0 flex items-center justify-center"><div class="h-32 w-32 animate-ping rounded-full bg-white"></div></div>`,
    vars: [],
  },
  {
    // Promoted from Tier 2 — a radial reveal growing from the centre. Distinct
    // from `zoom-out` (which is a small ping) because this fills the frame.
    // Implementation: a circle whose width/height tween from 0 → 250vmax so it
    // exceeds the iframe bounds. Tailwind’s `rounded-full` keeps the shape clean.
    id: "wipe-circle",
    name: "Wipe (circle reveal)",
    description:
      "Circular wipe that grows from the centre to fill the frame. Use to feel like a camera-iris reveal between scenes.",
    kind: "wipe",
    tier: 1,
    defaultDurationMs: 600,
    template: `<div class="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"><div class="rounded-full {{bgClass}}" style="width: 0; height: 0; animation: vf-wipe-circle 0.6s ease-out forwards;"></div></div><style>@keyframes vf-wipe-circle { to { width: 250vmax; height: 250vmax; } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the growing circle. Examples: 'bg-black', 'bg-white', 'bg-indigo-600'.",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    // Promoted from Tier 2 — a solid colour layer that scales 0→1→1.5 with an
    // opacity flash on the way out. Reads as a beat-sync "punch" because the
    // motion accelerates into frame and overshoots before clearing.
    id: "zoom-punch-in",
    name: "Zoom Punch (in)",
    description:
      "Solid colour panel that punches in toward the camera and clears. Beat-syncs well with music drops; punchier than `zoom-in`.",
    kind: "zoom",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 origin-center {{bgClass}}" style="transform: scale(0); opacity: 0; animation: vf-zoom-punch-in 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;"></div><style>@keyframes vf-zoom-punch-in { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the punching panel. Examples: 'bg-black' (cinematic), 'bg-white' (flash), 'bg-rose-500' (brand).",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    // Promoted from Tier 2 — a backdrop-filter blur that pulses across the
    // window. Real dream-bridge effect (the underlying frame is genuinely
    // blurred) rather than a colour wash. Animates opacity (well-supported)
    // on a layer that has a static backdrop-filter applied.
    id: "blur-bridge",
    name: "Blur Bridge",
    description:
      "Both clips blur into each other during the handoff window via a backdrop-filter pulse. Use for dream / introspective transitions.",
    kind: "blur",
    tier: 1,
    defaultDurationMs: 600,
    template: `<div class="absolute inset-0 pointer-events-none" style="backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.04); opacity: 0; animation: vf-blur-bridge 0.6s ease-in-out forwards;"></div><style>@keyframes vf-blur-bridge { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }</style>`,
    vars: [],
  },
  {
    // Promoted from Tier 2 — a diagonally-oriented coloured strip that sweeps
    // across the frame. The strip is rotated 20° and translated from far-left
    // off-screen to far-right off-screen. Width is 40% so the sweep reads as a
    // band, not a full wash.
    id: "wipe-diagonal",
    name: "Wipe (diagonal)",
    description:
      "Diagonal band that sweeps across the frame. Use for energetic scene changes — think sports highlight reels.",
    kind: "wipe",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 overflow-hidden pointer-events-none"><div class="absolute top-[-50%] left-0 h-[200%] w-[40%] {{bgClass}}" style="transform: translateX(-300%) rotate(20deg); animation: vf-wipe-diagonal 0.5s ease-in-out forwards;"></div></div><style>@keyframes vf-wipe-diagonal { to { transform: translateX(400%) rotate(20deg); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the sweeping band. Examples: 'bg-black', 'bg-white', 'bg-amber-400'.",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    // Promoted from Tier 2 — a two-layer slide that reads as cards stacking. A
    // soft shadow band leads the coloured panel by ~10% so the eye sees one
    // "card" sliding over another rather than a single wash.
    id: "slide-stack",
    name: "Slide Stack",
    description:
      "Two-layer slide — a coloured panel with a soft shadow edge slides across, reading like one card stacking over another. Punchier than `slide-left`.",
    kind: "slide",
    tier: 1,
    defaultDurationMs: 600,
    template: `<div class="absolute inset-0 overflow-hidden pointer-events-none"><div class="absolute inset-y-0 left-0 w-full bg-black/30" style="transform: translateX(-110%); animation: vf-slide-stack-shadow 0.6s ease-out forwards;"></div><div class="absolute inset-y-0 left-0 w-full {{bgClass}}" style="transform: translateX(-100%); animation: vf-slide-stack-card 0.6s ease-out forwards;"></div></div><style>@keyframes vf-slide-stack-card { to { transform: translateX(100%); } } @keyframes vf-slide-stack-shadow { to { transform: translateX(110%); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the leading card. Examples: 'bg-white', 'bg-indigo-600', 'bg-rose-500'.",
        required: true,
        defaultValue: "bg-white",
      },
    ],
  },
  {
    // Promoted from Tier 2 — mirror of `zoom-punch-in`. Starts large, shrinks
    // to a vanishing point. Same easing curve so the pair feels symmetrical.
    id: "zoom-punch-out",
    name: "Zoom Punch (out)",
    description:
      "Solid colour panel that punches OUT toward a vanishing point. Mirror of `zoom-punch-in`; use to feel like falling away from a moment.",
    kind: "zoom",
    tier: 1,
    defaultDurationMs: 500,
    template: `<div class="absolute inset-0 origin-center {{bgClass}}" style="transform: scale(1.5); opacity: 0; animation: vf-zoom-punch-out 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;"></div><style>@keyframes vf-zoom-punch-out { 0% { transform: scale(1.5); opacity: 0; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the shrinking panel. Examples: 'bg-black' (cinematic), 'bg-white' (flash), 'bg-rose-500' (brand).",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    // Promoted from Tier 2 — a 4×4 grid of tiles that flash in then out with a
    // diagonal stagger. Each tile shares the same `bgClass`; the diagonal
    // delay pattern (0,60,120,180 / 60,120,180,240 / 120,180,240,300 /
    // 180,240,300,360 ms) creates a sweep that reads as "checkerboard reveal".
    // The keyframes ramp opacity to 1 at the midpoint then fade — so each
    // tile flickers on then off as the wave passes through it.
    id: "wipe-checker",
    name: "Wipe (checkerboard)",
    description:
      "Tiled checkerboard wipe — 4×4 tiles flash on with a diagonal stagger. Use for retro / game-show / data-driven scene changes.",
    kind: "wipe",
    tier: 1,
    defaultDurationMs: 700,
    template: `<div class="absolute inset-0 grid grid-cols-4 grid-rows-4 overflow-hidden pointer-events-none"><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:0ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:60ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:120ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:180ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:60ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:120ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:180ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:240ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:120ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:180ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:240ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:300ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:180ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:240ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:300ms"></div><div class="{{bgClass}}" style="opacity:0;animation:vf-wipe-checker 0.7s ease-out forwards;animation-delay:360ms"></div></div><style>@keyframes vf-wipe-checker { 50% { opacity: 1; } 100% { opacity: 0; } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for each tile. Examples: 'bg-black', 'bg-white', 'bg-emerald-500'.",
        required: true,
        defaultValue: "bg-black",
      },
    ],
  },
  {
    // Promoted from Tier 2 — `clip-path: circle(R at <anchor>)` lets us tween
    // the visible coloured area between two circles around the same anchor.
    // For iris-open, R goes from 150% → 0% so the overlay shrinks to the
    // anchor, revealing the next clip "through" the iris. The anchor is
    // carried via a CSS custom property so the same value is used by both
    // the static rule and the @keyframes terminal frame.
    id: "iris-open",
    name: "Iris Open",
    description:
      "Camera-iris that opens from an anchor point — coloured fill shrinks to a vanishing pinhole at the anchor. Use for focus-pulls and dramatic reveals.",
    kind: "wipe",
    tier: 1,
    defaultDurationMs: 700,
    template: `<div class="absolute inset-0 {{bgClass}} pointer-events-none" style="--vf-anchor: {{anchor}}; clip-path: circle(150% at var(--vf-anchor)); animation: vf-iris-open 0.7s ease-in forwards;"></div><style>@keyframes vf-iris-open { to { clip-path: circle(0% at var(--vf-anchor)); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the iris fill. Examples: 'bg-black' (cinematic), 'bg-white' (flash), 'bg-slate-900'.",
        required: true,
        defaultValue: "bg-black",
      },
      {
        name: "anchor",
        description:
          "CSS position pair (`X Y`) where the iris collapses to. Examples: '50% 50%' (centre), '50% 0%' (top-centre), '0% 100%' (bottom-left), '100% 50%' (right-middle). Use the most expressive focal point in the next clip.",
        required: true,
        defaultValue: "50% 50%",
      },
    ],
  },
  {
    // Promoted from Tier 2 — mirror of `iris-open`. Same clip-path mechanism,
    // but R grows 0% → 150% so the coloured fill blooms outward from the
    // anchor and covers the frame. Reads like a camera-iris closing on a
    // subject before the cut.
    id: "iris-close",
    name: "Iris Close",
    description:
      "Camera-iris that closes onto an anchor point — coloured fill blooms outward from the anchor until it covers the frame. Mirror of `iris-open`.",
    kind: "wipe",
    tier: 1,
    defaultDurationMs: 700,
    template: `<div class="absolute inset-0 {{bgClass}} pointer-events-none" style="--vf-anchor: {{anchor}}; clip-path: circle(0% at var(--vf-anchor)); animation: vf-iris-close 0.7s ease-out forwards;"></div><style>@keyframes vf-iris-close { to { clip-path: circle(150% at var(--vf-anchor)); } }</style>`,
    vars: [
      {
        name: "bgClass",
        description:
          "Tailwind background class for the iris fill. Examples: 'bg-black' (cinematic), 'bg-white' (flash), 'bg-slate-900'.",
        required: true,
        defaultValue: "bg-black",
      },
      {
        name: "anchor",
        description:
          "CSS position pair (`X Y`) where the iris blooms from. Examples: '50% 50%' (centre), '50% 0%' (top-centre), '0% 100%' (bottom-left), '100% 50%' (right-middle). Use the most expressive focal point in the previous clip.",
        required: true,
        defaultValue: "50% 50%",
      },
    ],
  },
  {
    // Promoted from Tier 2 — three layered RGB rectangles with mix-blend-mode
    // `screen` so their offsets read as chromatic aberration. Each channel
    // jitters with its own translate keyframes; a brief white flash at 40-50%
    // hides the underlying cut. `steps(5)` easing gives the stutter feel.
    // Hardcoded RGB — the look IS the look, no vars.
    id: "glitch-cut",
    name: "Glitch Cut",
    description:
      "Brief RGB-split + white flash. Stuttered chromatic aberration over the cut window. Use sparingly for tech / cyberpunk / data-corruption vibes.",
    kind: "blur",
    tier: 1,
    defaultDurationMs: 350,
    template: `<div class="absolute inset-0 pointer-events-none overflow-hidden"><div class="absolute inset-0 bg-red-500" style="mix-blend-mode: screen; opacity: 0; animation: vf-glitch-r 0.35s steps(5) forwards;"></div><div class="absolute inset-0 bg-green-500" style="mix-blend-mode: screen; opacity: 0; animation: vf-glitch-g 0.35s steps(5) forwards;"></div><div class="absolute inset-0 bg-blue-500" style="mix-blend-mode: screen; opacity: 0; animation: vf-glitch-b 0.35s steps(5) forwards;"></div><div class="absolute inset-0 bg-white" style="opacity: 0; animation: vf-glitch-flash 0.35s steps(5) forwards;"></div></div><style>@keyframes vf-glitch-r { 0% { opacity: 0; transform: translate(0,0); } 30% { opacity: 0.7; transform: translate(-3%, 1%); } 60% { opacity: 0.5; transform: translate(2%, -1%); } 100% { opacity: 0; transform: translate(0,0); } } @keyframes vf-glitch-g { 0% { opacity: 0; transform: translate(0,0); } 30% { opacity: 0.6; transform: translate(2%, -1%); } 60% { opacity: 0.5; transform: translate(-2%, 2%); } 100% { opacity: 0; transform: translate(0,0); } } @keyframes vf-glitch-b { 0% { opacity: 0; transform: translate(0,0); } 30% { opacity: 0.6; transform: translate(-1%, 2%); } 60% { opacity: 0.7; transform: translate(1%, -2%); } 100% { opacity: 0; transform: translate(0,0); } } @keyframes vf-glitch-flash { 40%, 50% { opacity: 0.4; } }</style>`,
    vars: [],
  },

  //
  // ── Tier 2 (catalog stubs — planned, not yet shipped) ────────────────────
  // The agent can see these in `get-transition-schemas` and plan toward them
  // ("I'd use a 'morph-shapes' here once it's available"), but `add-transition`
  // will refuse to emit a non-renderable entry. Promote one to Tier 1 by
  // adding `template` + `vars` and flipping `tier`.
  //
  {
    id: "morph-shapes",
    name: "Morph Shapes",
    description:
      "Foreground SVG shapes morph between clips' palettes — bridges scene changes without breaking continuity.",
    kind: "morph",
    tier: 2,
    defaultDurationMs: 800,
    vars: [],
  },
  {
    id: "morph-type",
    name: "Morph Type",
    description:
      "Headline characters tween from the previous text to the next via SVG path morph. Works best on title cards.",
    kind: "morph",
    tier: 2,
    defaultDurationMs: 900,
    vars: [],
  },

  //
  // ── Tier 3 (VFX — registry-backed, future-only) ──────────────────────────
  // Backed by `hyperframes-registry` packages (see future-roadmap.md). These
  // need an install pipeline before we can ship them. Catalog presence lets
  // the agent suggest them when the brief calls for high-impact moments.
  //
  {
    id: "vfx-shatter",
    name: "VFX — Shatter",
    description: "Glass-shatter transition. Backed by `hyperframes-registry/vfx-shatter`.",
    kind: "vfx",
    tier: 3,
    defaultDurationMs: 900,
    vars: [],
  },
  {
    id: "vfx-liquid",
    name: "VFX — Liquid Bridge",
    description: "Liquid-ink bleed between clips. Backed by `hyperframes-registry/vfx-liquid`.",
    kind: "vfx",
    tier: 3,
    defaultDurationMs: 1000,
    vars: [],
  },
  {
    id: "vfx-portal",
    name: "VFX — Portal",
    description: "Sci-fi portal reveals the next clip. Backed by `hyperframes-registry/vfx-portal`.",
    kind: "vfx",
    tier: 3,
    defaultDurationMs: 1100,
    vars: [],
  },
];

export function createTransitionRegistryService(): TransitionRegistryService {
  return {
    getTransitionSchemas: () => TRANSITIONS,
  };
}
