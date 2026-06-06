# LLD-07 — Captions Adoption Plan

> Status: **Planning** — no code adopted yet. This doc captures *why* captions matter for VibeFrames, *how* we'd integrate them with our existing composition model, and *what the agent surface looks like* (registry + tool + skill).

## Context

Short-form social video lives or dies on captions. TikTok, Reels, and Shorts viewers watch with sound off ~80% of the time. The HyperFrames ecosystem ships captions primitives (timing, styling, kinetic word reveal) — adopting them turns VibeFrames from "make a clip" into "make a clip that converts on a phone".

Captions are different from text blocks (`hero-title`, `subtitle-anchor`, …) in three ways:

1. **Time-resolved**: captions have *cue points* (start/end per word or phrase), not just a clip-level start/duration.
2. **Source-driven**: captions usually derive from a script or a transcript, not free-form copy. There's a transcribe-then-style pipeline.
3. **Track-aware in a different sense**: captions span multiple clips on the same source track and don't necessarily align with clip boundaries.

So they earn their own model, registry, tools, and skill — same shape as transitions.

## Model — `Caption` and `CaptionTrack`

```ts
export interface CaptionCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  // Optional per-cue emphasis: render in accent colour, bold, larger, etc.
  emphasis?: "none" | "accent" | "shout";
}

export interface CaptionTrack {
  id: string;            // e.g. "caption-track-main"
  label: string;
  styleId: string;       // points into the caption-registry
  cues: CaptionCue[];
}

export interface Composition {
  // existing fields …
  captionTracks: CaptionTrack[];   // separate from `tracks`
}
```

Why a separate top-level field? Captions render as a single overlay band that stays put while clips change — hoisting them keeps mutations simple and lets the renderer treat them as a layer of their own.

## Caption styles registry

Same shape as `clip-registry` and `transition-registry`. Each style is a Tailwind HTML template with a single `{{text}}` slot (and optionally `{{emphasis}}` modifier classes).

| Style id | Vibe | When to use |
|---|---|---|
| `caption-classic` | White-on-black-stroke, sans, centred bottom | Default — works on any background |
| `caption-tiktok` | Black box, white sans, slight shadow | TikTok / Reels native feel |
| `caption-bold-accent` | All-caps black text on yellow highlight band, anchored bottom-centre | Punchy / brandable |
| `caption-kinetic-word` | One word at a time with a colour pulse on the active word | Tutorials / explainers |
| `caption-typewriter` | Reveal characters left-to-right per cue | Dramatic / reveal beats |
| `caption-bilingual` | Two-line stack: source + translation | International audiences |

Tier 1 ships the first three. Kinetic / typewriter / bilingual become Tier 2 stubs (catalog-visible but `add-caption-cue` refuses) until the renderer learns per-character timing.

## Registry & service

`src/harness/services/caption-registry.service.ts` — same pattern as the others:

```ts
export interface HyperFramesCaptionStyle {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  defaultStyleClasses: string;     // Tailwind classes for the band
  template?: string;               // single-cue render template
  vars: BlockVar[];
}
```

## Tools

We add three tools (pattern matches `add-clip` / `add-transition`):

- **`get-caption-styles`** — lists styles. Same shape as `get-block-schemas`.
- **`add-caption-cue`** — appends a `CaptionCue` to a `CaptionTrack` (creates the track if missing).
- **`set-caption-style`** — switches `styleId` on a track without touching cues.

```ts
inputSchema: {
  projectId: string,
  trackId: string,                    // e.g. "caption-track-main"
  styleId?: string,                   // required if track is new
  startMs: number,
  endMs: number,
  text: string,
  emphasis?: "none" | "accent" | "shout",
}
```

The cue's start/end aren't snapped to clip boundaries — captions don't need to.

## Pipeline — script → cues

Three input modes (in priority order):

1. **Pre-timed cues** — agent emits `add-caption-cue` calls directly. Works today, but requires the LLM to author timing, which is error-prone for long scripts.
2. **Script → auto-time** — agent provides a plain-text script and a target duration; a server-side splitter (`src/harness/services/caption-timer.service.ts`) breaks it into cues using a simple "≈3 words/sec for casual, ≈4.5 words/sec for upbeat" heuristic. The agent picks the WPM via a tool param.
3. **Audio → transcribe → align** *(Phase 2)* — when we land voice-gen (see `future-roadmap.md`), pipe TTS output through a forced-aligner (Whisper word-timings) to get exact cue boundaries.

We ship Phase 1 (pre-timed) on day one and Phase 2 (script splitter) right after — Phase 3 waits for voice-gen.

## Skill — `skills/captions/skill.md`

Mirrors `skills/transitions/skill.md`:

- When to add captions (always for short-form social; rarely for cinematic intros).
- Style picker (TikTok vs classic vs accent).
- Timing rules of thumb (max 7 words per cue, min 800ms per cue, no overlapping cues).
- Tier-aware fallback (kinetic-word → bold-accent until kinetic ships).
- Best-practice checklist.

## Renderer contract

Captions render as a single band rendered by the timeline player on its own z-layer above clip tracks but below transition overlays. The renderer:

1. Reads `composition.captionTracks`.
2. For each track, applies `defaultStyleClasses` to the band container.
3. At each frame, finds the active cue (`startMs ≤ t < endMs`) and substitutes into `template`.
4. For kinetic styles, additionally paints per-word/character timing.

For Tier A we can sidestep the renderer change by emitting captions *as* clip overlays on a dedicated `track-captions` lane. That lets us ship the agent surface immediately and migrate to a first-class layer when we adopt `@hyperframes/studio` Player (Tier A in `lld-06-studio-adoption.md`).

## Adoption order

| Milestone | Output |
|---|---|
| **C1** | Model + registry + 3 Tier 1 styles + `get-caption-styles` + `add-caption-cue` + skill, all rendered as track-captions clip overlays |
| **C2** | `set-caption-style` + script-splitter service + `add-caption-script` tool (Phase 2 pipeline) |
| **C3** | First-class caption layer in renderer (post Studio Tier A) |
| **C4** | Kinetic word + typewriter Tier 1 (post per-word timing in renderer) |
| **C5** | Audio-driven cues (post voice-gen) |

## Risks & escape hatches

- **Timing UX**: bad caption timing is *worse* than no captions. Phase 2's heuristic splitter must be tuned with real briefs before being default.
- **Style collisions with overlay blocks**: `like-counter`, `follow-button`, etc. live at the same anchors as captions. The renderer needs a stacking policy — captions go above social overlays but below transition overlays.
- **Internationalisation**: bilingual style needs CJK/RTL testing before C1 marks "done".

## Why this earns its own LLD

Captions touch the model (new top-level field), the renderer (new layer), the agent (new tools + skill), and the user (visible everywhere). Each layer is a small change; together they're an axis of the product, like transitions. Capturing the plan here keeps later sessions short and surgical.
