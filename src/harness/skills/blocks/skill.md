---
name: blocks
description: Use before authoring any clip HTML. The block catalog is a registry of pre-designed, brand-safe Tailwind scenes — backgrounds, titles, scenes, stats, quotes, CTAs, end-cards, lower-thirds. Reaching for free-form HTML without checking the catalog first is the #1 cause of generic output.
---

# Blocks — Catalog & Composition Skill

You are picking from a **registry of pre-designed Tailwind blocks** rather than writing raw HTML from scratch. Calling `get-block-schemas` returns every block's template + `{{slot}}` variables.

This skill covers **scene-building blocks**. For specialist overlays see `skills/social-overlays/skill.md`, `skills/effects/skill.md`, and `skills/transitions/skill.md`.

## The Iron Law

```
CALL get-block-schemas BEFORE WRITING FREE-FORM HTML. EVERY TURN.
```

Free-form HTML is the **fallback**, not the default. The catalog already encodes typography ramp, safe-area padding, contrast, and a coherent visual language — things free-form HTML routinely gets wrong. If a block fits, use it. If no block fits, *say so in your reply* before reaching for free-form.

Thinking *"I'll just write a quick `<div class='bg-black'>` — it's faster than scanning the catalog"*? Stop. That's how every clip ends up looking like every other clip.

<Good>
```
1. get-block-schemas → found `hero-title` matches "opening beat with one headline"
2. add-clip { html: <hero-title>, vars: { title: "AI Gateway" }, track 0, 0–3s }
3. add-clip { html: <subtitle-anchor>, vars: { text: "One API. Every model.", anchor: "items-end" }, track 1, 0–3s }
```
Layered blocks. Brand-safe typography. Catalog-encoded contrast.
</Good>

<Bad>
```
1. add-clip { html: "<div class='bg-black h-full w-full flex items-center justify-center'><h1 class='text-white text-5xl'>AI Gateway</h1></div>" }
```
Skipped `get-block-schemas`. Re-invented the hero layout. Picked `text-5xl` where the ramp says `text-7xl`. This is the lazy default the catalog exists to prevent.
</Bad>

## Two kinds of blocks

Every block has a **`kind`**:

- **`unit`** — atomic block designed to layer with peers on adjacent tracks (backgrounds, titles, captions, overlays). Stack 2–4 of these per scene to build a layered composition.
- **`composition`** — self-contained full-scene block. One clip = one beat. Use when you want a quick, opinionated scene without layering.

Pick `unit` when you want fine control over each layer (background colour separate from the headline, separate caption track). Pick `composition` when the brief calls for a single self-contained beat (a hero title, a stat callout, an end card).

## Atomic units — the canonical 3-clip pattern (bg → title → subtitle)

Use these when you want layered control over a single scene.

| Block id | Kind | Category | When to use | Vars |
|---|---|---|---|---|
| `background-fill` | unit | background | Track-0 base of every composition. One per composition, spanning the full duration | `bgClass` |
| `logo-headline` | unit | title | Logo image + brand title, centred. Track 1, overlaid on a `background-fill` | `logoUrl`, `title` |
| `subtitle-anchor` | unit | lower-third | Single tagline anchored top / centre / bottom. Track 2, overlaid above `logo-headline` | `text`, `anchor` |

## Composition blocks — one clip = one full scene

These already include their own background and styling. Use when you want a single self-contained beat without layering.

| Block id | Kind | Category | When to use | Vars |
|---|---|---|---|---|
| `hero-title` | composition | title | Opening beat — single big headline on a dark gradient | `title` |
| `kinetic-words` | composition | title | Punchy staccato intro — three words, middle word coloured. Use 2–3 back-to-back clips on the same track | `word1`, `word2`, `word3` |
| `split-screen` | composition | scene | Two-column scene with heading + subheading on the left and an accent panel on the right | `heading`, `subheading`, `accent`* |
| `stats-callout` | composition | stats | One giant number + caps label. Single-metric emphasis | `number`, `label` |
| `quote-pull` | composition | quote | Pull quote with attribution — testimonials, mission statements | `quote`, `attribution` |
| `cta-button` | composition | cta | Closing beat — headline + pill button driving an action | `headline`, `cta` |
| `end-card` | composition | end | Final clip — brand wordmark + tagline + URL | `brand`, `tagline`, `url` |

\* optional

## Overlay units — lower-thirds

| Block id | Kind | Category | When to use | Vars |
|---|---|---|---|---|
| `lower-third` | unit | lower-third | Name + role overlay anchored bottom-left. Track 2+ over a background scene | `name`, `role` |

## Canonical 3-clip pattern (when to layer atoms)

For product intros and brand reveals, use the **vercel-intro pattern**: three layered atomic clips spanning the same time range. This is the most legible composition for short brand beats.

```
Track 0 (background): background-fill              0 ─────► duration
Track 1 (hero):       logo-headline                0 ─────► duration
Track 2 (caption):    subtitle-anchor (bottom)     0 ─────► duration
```

Example call sequence for a 6-second Vercel-style intro:

1. `add-clip` → `background-fill { bgClass: "bg-black" }`, track 0, start 0, duration 6000
2. `add-clip` → `logo-headline { logoUrl: "https://vercel.com/favicon.ico", title: "AI Gateway" }`, track 1, start 0, duration 6000
3. `add-clip` → `subtitle-anchor { text: "One API. Every Model.", anchor: "items-end justify-center" }`, track 2, start 0, duration 6000

## Block usage pattern

1. **Plan the composition** at a high level (intro beat → reveal → CTA → end card).
2. **Call `get-block-schemas`** — once per turn is enough; cache the result mentally.
3. **Decide kind per beat**:
   - Single, self-contained scene? Reach for a `composition` block (`hero-title`, `split-screen`, …).
   - Layered scene with a separate background, hero, and caption? Use the atomic `unit` trio (`background-fill` + `logo-headline` + `subtitle-anchor`).
4. **Substitute** each `{{var}}` with copy that fits the var's description (e.g. `hero-title.title` is 1–4 words; `quote-pull.quote` ≤25 words).
5. **Pass the substituted HTML** to `add-clip`'s `html` parameter (inner body only — no `<div data-clip-id>` wrapper).
6. **Pick the track** by category: backgrounds on 0, titles/stats/quotes/CTAs/end-cards on 1, lower-thirds on 2. Social overlays live on track 3+ (see `skills/social-overlays/skill.md`); effects live on the top-most track (see `skills/effects/skill.md`).

A typical 12s multi-scene intro: `background-fill` (0–12s, track 0) → `logo-headline` (0–3s, track 1) → `split-screen` (3–7s, track 1) → `cta-button` (7–10s, track 1) → `end-card` (10–12s, track 1).

## Picking a block — quick decision flow

- Need a base colour or gradient behind everything? → `background-fill` on track 0
- Need a single dramatic headline? → `hero-title` (composition) **or** `logo-headline` + `subtitle-anchor` (layered)
- Need a 3-word staccato beat? → `kinetic-words`
- Need to introduce a feature / product? → `split-screen` (text-left, accent panel right)
- Need to emphasise a single metric? → `stats-callout`
- Need to land a testimonial? → `quote-pull`
- Need to drive an action? → `cta-button`
- Need to close the video? → `end-card`
- Need to name the speaker / brand mid-scene? → `lower-third` overlay

If none of these fit, fall back to free-form HTML — and **say so in your reply** (*"No catalog block fits a `<feature-grid>` brief; I'm composing free-form."*). See `skills/hyperframes/skill.md` for the render contract, layout fundamentals, and free-form examples.
