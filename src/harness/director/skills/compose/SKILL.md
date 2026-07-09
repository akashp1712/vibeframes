---
name: compose
description: Use when turning a user's request into a VibeFrames video — how to pick scene blocks, sequence them, and fill their props well.
---

# Compose a video

You build a video by calling `add-clip` once per scene, in order. This skill is
the playbook for *what* makes a good one.

## Scene blocks

- **KineticTitle** — bold opener. `words` (2–4 punchy words), optional `eyebrow`.
- **BulletReveal** — numbered cards. `heading` + `bullets` (2–4, ≤5 words each).
- **StatReveal** — one big number that counts up. `value`, `suffix` (`%`/`x`/`ms`), `label`.
- **BarChart** — compare 2–5 values. `heading` + `bars: [{label, value}]`.
- **CodeReveal** — code that types itself out. `filename` + `lines` (≤6 short lines).
- **FlowDiagram** — 2–5 labelled nodes joined by drawing connectors with a flowing
  pulse. `heading` + `nodes` (flow order). Use for pipelines / how-it-works / steps.
- **SplitCompare** — two panels slide in for before/after or us-vs-them.
  `leftLabel`+`leftValue`, `rightLabel`+`rightValue` (right = the winner).
- **BigQuote** — large pull-quote. `quote` + `author`. Testimonial or punchy closer.
- **DeviceMockup** — a browser window floating up with a product screen.
  `url` + `screenTitle` + `screenSub`. For app / product / launch videos.
- **AudioPulse** — a `title` over an equalizer that pulses to a music bed. Use at
  most ONCE per video, as an energetic opener or closer.
- **LogoOutro** — closing brand. `title` + `tagline`.

## How to choose scenes (think, don't copy)

There is no fixed template. Read the actual request, decide what it's really
about, and pick the blocks that fit *that*. Match intent to block:

- a number / metric / speed / growth → **StatReveal**
- comparing two or more things → **BarChart** (many) or **SplitCompare** (two)
- a before/after or old-way/new-way → **SplitCompare**
- a process, pipeline, steps, or "how it works" → **FlowDiagram**
- code, an API, an SDK, anything technical → **CodeReveal**
- a testimonial, a bold claim, a mic-drop line → **BigQuote**
- an app / product / website → **DeviceMockup**
- an energetic hype opener → **AudioPulse** (at most once)
- a list of points / features / reasons → **BulletReveal**

Different prompts should produce genuinely different videos. A data story leans
on StatReveal + BarChart; a dev tool leans on CodeReveal + FlowDiagram; a brand
teaser leans on KineticTitle + BigQuote + DeviceMockup. Don't reach for the same
sequence every time.

## Shape & rules

- **4–6 scenes**, usually a KineticTitle open and a LogoOutro close, with a
  *varied mix* between. Never repeat the same block three times in a row.
- **Always fill props fully.** Never send an empty `bullets`/`words`/`bars`/
  `lines`. If a detail isn't given, invent something plausible and on-brand.
- **Timing (30fps):** first clip `from: 0`; each next `from` = previous `from` +
  its `durationInFrames`. Scenes 60–120 frames; total ~10–18s.
- **Copy is punchy:** titles ≤5 words, bullets ≤5 words. This is motion graphics.
- **Editing:** if the user asks to change / redo / replace / restructure, call
  `clear-composition` FIRST, then rebuild. Skip the clear only for a purely
  additive request.
- Infer everything from the request — never ask questions. Then reply in one
  short sentence describing the video you made.
