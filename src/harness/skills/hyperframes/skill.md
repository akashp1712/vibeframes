---
name: hyperframes
description: Universal foundation for composing HTML/CSS clips in VibeFrames Studio. Use on every turn — the render contract, the stage, the typography ramp, the timing rules, and the discipline that gates `add-clip` calls. Every other VibeFrames skill builds on this one.
---

# HyperFrames — Composition Skill

You are composing **video clips as HTML**. Each clip is a fragment of HTML+Tailwind that occupies a slice of time on a track. The HyperFrames renderer reads `data-*` attributes on each clip and animates opacity / position based on the timeline.

This skill is the **universal foundation**. Every other VibeFrames skill builds on it:

- `skills/blocks/skill.md` — registry of pre-designed scene blocks (backgrounds, titles, scenes, CTAs). **Prefer blocks to free-form HTML.**
- `skills/social-overlays/skill.md` — TikTok / IG / X UI overlays (avatar, mention, hashtag, comment, like-counter, follow).
- `skills/effects/skill.md` — cosmetic full-frame textures (grain, scanlines).
- `skills/transitions/skill.md` — clip-to-clip transitions (fade, slide, zoom, wipe, blur).

## The Iron Law

```
BUILD WHAT WAS ASKED. EVERY CLIP EARNS ITS PLACE.
```

A request for *"a title card"* is not a request for *"a title card + 3 supporting scenes + ambient music + captions"*. If additional clips would genuinely improve the piece, **propose them in your reply** — don't add them silently.

Thinking *"I'll just add one more clip to make it feel complete"*? Stop. That's rationalization. Build the brief. Iterate on signal.

## Discovery (open prompts only)

If the user said *"make me a video"* / *"surprise me"* / *"intro for our product"* without a brand or platform, **ask before composing**:

- **Audience** — devs / executives / consumers / creators?
- **Platform** — landing hero / social ad / product demo / internal?
- **Mood** — clean / playful / cinematic / retro?
- **Brand colors or fonts** — any constraints, or pick freely?

Skip if the user already named these. For specific requests (*"add a CTA"*, *"fix timing on clip 3"*), go straight to the plan.

## Plan before tools

Before calling `add-clip` even once, think:

1. **What** — what should the viewer experience? Name the message in one sentence.
2. **Structure** — how many beats? Which clip is hero, which is support, which is CTA?
3. **Rhythm** — pacing pattern. Three identical 3000ms holds = slideshow. Try `hook · hold · resolve` (1.2s · 4s · 2.8s) or `fast-fast-SLOW-fast`.
4. **Timing** — total duration; which clips abut, which overlap, where do transitions land.
5. **Layout** — end-state per beat (see Layout Before Animation below).
6. **Direction** — colour, typography, motion choices grounded in the brief — not lazy defaults.

For small edits (one color, one duration), skip straight to the rules.

## Layout Before Animation

Position every element where it should be at its **most visible moment** — the frame when it's fully on screen, correctly placed, and not yet exiting. Build that as static HTML+CSS first. The renderer handles fade-in / fade-out; you focus on the **end-state layout**.

**Why**: if you position elements at their animated start state (offscreen, scale 0, opacity 0), overlaps and overflow are invisible until the video plays. Build the end-state first, see and fix layout, then trust the renderer for entries / exits.

<Good>
```html
<!-- End-state: where everything lives at its most visible moment. -->
<div class="flex h-full w-full flex-col items-center justify-center gap-6 bg-black px-20">
  <h1 class="text-7xl font-bold tracking-tight text-white">AI Gateway</h1>
  <p class="text-2xl text-slate-400">One API. Every model.</p>
</div>
```
Flex layout, padding pushes content inward, both elements visible together at the hero frame.
</Good>

<Bad>
```html
<!-- Animated start state baked into the layout — you can't see overlap until it renders. -->
<div class="absolute inset-0 bg-black">
  <h1 class="absolute left-[160px] top-[200px] text-7xl opacity-0">AI Gateway</h1>
  <p class="absolute left-[160px] top-[400px] text-2xl opacity-0">One API. Every model.</p>
</div>
```
Absolute positioning + invisible elements = guessing the final layout. Use flex + the static end-state.
</Bad>

## The render contract (read carefully)

Every clip the agent emits MUST be a single root element with these data attributes already wired by the `add-clip` tool — you only author the **inner HTML body**:

```html
<div data-clip-id="…" class="clip" data-start="…" data-duration="…" data-track-index="…">
  <!-- YOUR HTML GOES HERE -->
</div>
```

So when you call `add-clip`, the `html` parameter is just the **inner body**, e.g. `<div class="…">Hello</div>`. Do NOT include the outer `<div data-clip-id>` wrapper — the tool adds it.

## Stage dimensions

- **Canvas: 1920 × 1080 (16:9)**
- Always design as if for a fullscreen video frame.
- **Safe area**: keep critical text and logos at least 80px from each edge to survive any crop or scale.

## Layout fundamentals

### Always make clip body fullscreen

Your root inner element should fill the clip. Default to:

```html
<div class="flex h-full w-full items-center justify-center">…</div>
```

Center is the sane default. Use `items-start` / `items-end` / `justify-start` / `justify-end` for top/bottom/side anchors.

### Tracks = layers (z-order)

- **Track 0**: background (solid color, gradient, image)
- **Track 1**: hero content (main heading, logo)
- **Track 2**: supporting content (subtitle, attribution, lower-third)
- **Track 3+**: social overlays — see `skills/social-overlays/skill.md`
- **Top-most track**: effects (grain, scanlines) — see `skills/effects/skill.md`

Higher track index renders on top. Add a separate clip on a separate track when content should overlap.

### Background clips span the whole timeline

If you want a black background through a 6-second intro, the background clip's `durationMs` should be 6000 starting at 0. Don't put it on the same track as text.

## Typography ramp (use these sizes)

| Role | Tailwind | px @ 1080p |
|------|----------|------------|
| Hero / headline | `text-7xl` or `text-8xl` | 72–96 |
| Section title | `text-5xl` or `text-6xl` | 48–60 |
| Body / subtitle | `text-2xl` or `text-3xl` | 24–30 |
| Caption | `text-lg` | 18 |
| Micro | `text-sm` | 14 |

Always pair with weight + tracking:
- Headlines → `font-bold tracking-tight` or `font-extrabold tracking-tighter`
- Subtitles → `font-medium tracking-wide` or default
- Captions → `font-medium uppercase tracking-wider`

Always set a text color explicitly (`text-white`, `text-slate-200`, `text-neutral-400`).

## Color palette guidelines

For a sleek modern look, prefer:

- **Backgrounds**: `bg-black`, `bg-slate-950`, `bg-neutral-950`, or `bg-gradient-to-br from-slate-900 to-slate-950`
- **Brand accents**: `bg-blue-500`, `bg-indigo-500`, `bg-violet-500`, `bg-emerald-500` — use sparingly
- **Text on dark**: `text-white` (primary), `text-slate-300` / `text-neutral-400` (secondary)
- **Text on light**: `text-neutral-900` (primary), `text-neutral-600` (secondary)

For a Vercel-like aesthetic: pure black background + white text + thin gray subtitle. For a more vivid brand intro: gradient background + bold white text + colored accent line.

## Timing heuristics

| Composition | Total duration | Per-clip duration |
|-------------|---------------|-------------------|
| Logo intro | 3–4s | hero 2s, subtitle 1.5s |
| Product reveal | 6–8s | hero 3s, subtitle 3s, CTA 2s |
| Lower-third overlay | 4–5s | overlay matches main duration |
| Multi-scene intro | 8–12s | each scene 3s, 0.3s overlap |

**Stagger entries**: subsequent clips on different tracks should start ~300–600ms after the previous one for a graceful reveal.

## Animation strategy

The HyperFrames renderer **already handles** clip fade-in and fade-out at the timeline level. You do not need to add fade animations in your HTML.

**What YOU should add inside clip HTML**:
- Static styling (gradients, borders, shadows)
- CSS keyframe animations (`@keyframes`, `animation: …`) for *intra-clip* motion (pulse, shimmer)
- Tailwind animate utilities (`animate-pulse`, `animate-bounce`) for subtle decoration

**What YOU should NOT add**:
- `<script>` tags — they're stripped or unsafe inside the iframe
- Fade-in/out — handled by the renderer
- Position transforms that conflict with the renderer's `opacity` tweens

## Lazy defaults to question

These are the "least-effort" choices that read as generic. Use them **only when the brief actually justifies them**, not as a fallback:

- `bg-black` + `text-white` everywhere — fine for a Vercel-coded tech brief; lazy for a playful brand reel.
- Three identical 3000ms holds — reads as a slideshow, not a video. Vary the pacing.
- Centered hero text in every clip — composition fatigue. Anchor some clips top / bottom / left.
- `text-blue-500` / `text-orange-500` / `text-purple-500` for accents — picks a different rainbow each clip. Pick **one** accent and reuse it.
- A transition between every clip — sometimes a hard cut is better. `cut` is a real option.

## Free-form HTML examples (fallback when no block fits)

**Prefer the block catalog** (`skills/blocks/skill.md`) before reaching for these patterns. Use them only when no registered block fits the brief.

### Minimal hero clip body

```html
<div class="flex h-full w-full flex-col items-center justify-center gap-6 bg-black">
  <svg width="64" height="56" viewBox="0 0 76 65" fill="white"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
  <h1 class="text-7xl font-bold tracking-tight text-white">AI Gateway</h1>
</div>
```

### Lower-third overlay

```html
<div class="flex h-full w-full items-end justify-start p-16">
  <div class="rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-6 backdrop-blur-md">
    <h2 class="text-4xl font-bold text-white">Akash Panchal</h2>
    <p class="text-2xl text-slate-300">Building VibeFrames</p>
  </div>
</div>
```

### Split-screen with image

```html
<div class="flex h-full w-full bg-slate-950 text-white">
  <div class="flex flex-1 flex-col justify-center px-20">
    <h2 class="mb-4 text-6xl font-bold tracking-tight">One API.</h2>
    <p class="text-2xl text-slate-400">Every model. Built for production.</p>
  </div>
  <div class="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600">
    <div class="text-9xl">⚡</div>
  </div>
</div>
```

## Definition of Done — before declaring the composition complete

Walk this checklist mentally before your final reply:

1. **Brief covered** — every requested beat / element is present; nothing extra crept in.
2. **Block-first** — checked `get-block-schemas` before reaching for free-form HTML (see `skills/blocks/skill.md`).
3. **Vars filled** — no leftover `{{slot}}` in the rendered HTML; transition `vars` chosen intentionally (not auto-filled defaults).
4. **Layout end-state** — clip body uses flex + padding, not absolute positioning of content containers.
5. **Colors consistent** — one palette across the composition, not per-clip rainbow accents.
6. **Typography ramp** — sizes from the table above; one weight pattern across the piece.
7. **Safe area** — critical text ≥80px from edges.
8. **Track roles** — bg=0, hero=1, support=2, social=3+, effects=top-most.
9. **Rhythm** — not three identical holds; pacing varies if the brief has a narrative arc.
10. **No `<script>` tags**, no fade animations in clip body.
11. **Honest disclosure** — in your final reply, name what you *didn't* verify (e.g. *"colors against a brand guide"*, *"how it looks on mobile crop"*) instead of claiming completeness you can't prove.
