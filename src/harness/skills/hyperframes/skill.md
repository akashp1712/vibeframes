---
name: hyperframes
description: Core knowledge for composing HTML/CSS clips in HyperFrames — the HTML-native video renderer used by VibeFrames Studio
---

# HyperFrames — Composition Skill

You are composing **video clips as HTML**. Each clip is a fragment of HTML+Tailwind that occupies a slice of time on a track. The HyperFrames renderer reads `data-*` attributes on each clip and animates opacity / position based on the timeline.

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
- **Track 3+**: overlays (badges, watermarks, decorative shapes)

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

The HyperFrames renderer **already handles** clip fade-in and fade-out at the timeline level (via GSAP). You do not need to add fade animations in your HTML.

**What YOU should add inside clip HTML**:
- Static styling (gradients, borders, shadows)
- CSS keyframe animations (`@keyframes`, `animation: …`) for *intra-clip* motion (pulse, shimmer)
- Tailwind animate utilities (`animate-pulse`, `animate-bounce`) for subtle decoration

**What YOU should NOT add**:
- `<script>` tags — they're stripped or unsafe inside the iframe
- Fade-in/out — handled by the renderer
- Position transforms that conflict with the renderer's `opacity`/`y` tweens

## Example: minimal hero clip body

```html
<div class="flex h-full w-full flex-col items-center justify-center gap-6 bg-black">
  <svg width="64" height="56" viewBox="0 0 76 65" fill="white"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
  <h1 class="text-7xl font-bold tracking-tight text-white">AI Gateway</h1>
</div>
```

## Example: lower-third overlay

```html
<div class="flex h-full w-full items-end justify-start p-16">
  <div class="rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-6 backdrop-blur-md">
    <h2 class="text-4xl font-bold text-white">Akash Panchal</h2>
    <p class="text-2xl text-slate-300">Building VibeFrames</p>
  </div>
</div>
```

## Example: split-screen with image

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

## Best-practice checklist before calling `add-clip`

1. Root element is `flex h-full w-full` (fills the clip)
2. Background color is explicit
3. Text color is explicit
4. Typography uses the ramp above
5. Safe area respected (≥80px padding from edges)
6. Track index chosen by layer role (bg=0, hero=1, support=2)
7. Timing fits the heuristic table
8. No `<script>` tags, no fade animations in body
