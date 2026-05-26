# HyperFrames Exploration

> **TL;DR** — HyperFrames is an open-source, HTML-native video framework by HeyGen. You write HTML with data attributes, preview in a browser, and render to MP4 via headless Chrome + FFmpeg. It ships a web-component player (`<hyperframes-player>`), a 50+ block catalog, GSAP-based animation, and agent skills that teach LLMs to author compositions. VibeFrames sits between the user's chat and HyperFrames' render pipeline — the agent writes the HTML the engine consumes.

---

## 1. What HyperFrames is

[hyperframes.dev](https://www.hyperframes.dev/) · [GitHub](https://github.com/heygen-com/hyperframes) · [prompting guide](https://hyperframes.heygen.com/guides/prompting)

HyperFrames turns HTML into deterministic, frame-by-frame rendered video. The authoring surface is a plain HTML document — no React, no proprietary DSL, no build step. Every timed element is an HTML node decorated with data attributes.

```html
<div id="root" data-composition-id="demo"
     data-start="0" data-width="1920" data-height="1080">

  <video id="clip-1" data-start="0" data-duration="5"
         data-track-index="0" src="intro.mp4" muted playsinline></video>

  <h1 id="title" class="clip"
      data-start="1" data-duration="4" data-track-index="1"
      style="font-size: 72px; color: white;">
    Welcome to HyperFrames
  </h1>

  <audio id="bg-music" data-start="0" data-duration="5"
         data-track-index="2" data-volume="0.5" src="music.wav"></audio>
</div>
```

Three rules:
1. **Root element** — must have `data-composition-id`, `data-width`, `data-height`.
2. **Timed elements** — need `data-start`, `data-duration`, `data-track-index`, and `class="clip"`.
3. **Animations** — GSAP timelines created with `{ paused: true }` and registered on `window.__timelines`.

The rendering pipeline is seek-driven: `frame = floor(time * fps)`. Each frame is independently captured via Chrome's `beginFrame` API and encoded with FFmpeg. Same input → identical output, every time.

---

## 2. Core data attributes

### Timing

| Attribute          | Example            | Description                                                   |
|--------------------|--------------------|-----------------------------------------------------------------|
| `data-start`       | `"0"` or `"intro"` | Start time in seconds, or a clip ID for relative timing        |
| `data-duration`    | `"5"`              | Duration in seconds (required for images, optional for media)  |
| `data-track-index` | `"0"`              | Timeline track number; higher = in front; same-track clips can't overlap |

### Media

| Attribute          | Example  | Description                            |
|--------------------|----------|----------------------------------------|
| `data-media-start` | `"2"`    | Media playback offset / trim (seconds) |
| `data-volume`      | `"0.8"`  | Audio/video volume, 0–1               |
| `data-has-audio`   | `"true"` | Indicates video has an audio track     |

### Composition

| Attribute               | Example                         | Description                         |
|-------------------------|---------------------------------|-------------------------------------|
| `data-composition-id`   | `"root"`                        | Unique ID for this composition      |
| `data-composition-src`  | `"compositions/intro-anim.html"`| Load nested composition from file   |
| `data-width` / `data-height` | `"1920"` / `"1080"`       | Canvas dimensions in pixels         |

---

## 3. Package inventory

HyperFrames ships as a set of npm packages, each with a single responsibility:

| Package                   | Purpose                                                                 |
|---------------------------|-------------------------------------------------------------------------|
| `hyperframes` (CLI)       | Create, preview, lint, render from the terminal. Wraps producer/engine/studio. |
| `@hyperframes/core`       | Types, HTML parsing/generation, linter, compiler, runtime. Foundation for everything. |
| `@hyperframes/engine`     | Seekable page-to-video capture engine. Loads HTML in headless Chrome, captures frame-by-frame. |
| `@hyperframes/producer`   | Full rendering pipeline — capture + FFmpeg encoding in one API call.    |
| `@hyperframes/player`     | Embeddable `<hyperframes-player>` web component. 3KB gzipped, zero deps. |
| `@hyperframes/studio`     | Visual composition editor UI — timeline, preview, code editing, hot reload. |

```
┌──────────────────────────────────────────────────┐
│                   CLI (hyperframes)               │
│  init · preview · render · lint · add · catalog   │
├──────────────────────────────────────────────────┤
│  studio        │  producer       │  player        │
│  (editor UI)   │  (render pipe)  │  (web comp.)   │
├────────────────┴────────┬────────┴────────────────┤
│                  engine                            │
│   Chrome beginFrame capture · FFmpeg encoding      │
├──────────────────────────────────────────────────┤
│                   core                             │
│   types · parser · linter · compiler · runtime     │
└──────────────────────────────────────────────────┘
```

---

## 4. Clip types and compositions

A **composition** is an HTML document defining a video timeline. Supported clip types:

- `<video>` — video clips, B-roll, A-roll
- `<img>` — static images, overlays
- `<audio>` — music, sound effects
- `<div data-composition-id="...">` — nested compositions (animations, grouped sequences)

Compositions can be nested (inline or via `data-composition-src`), enabling reusable scenes and modular authoring. External compositions wrap content in `<template>` tags and register their GSAP timelines on `window.__timelines`.

---

## 5. Block catalog

HyperFrames ships 50+ ready-to-use blocks and components installable via `npx hyperframes add <name>`:

**Blocks** (full sub-composition scenes):
- Social overlays — `x-post-card`, `reddit-post-card`, `instagram-follow`, `tiktok-follow`, `spotify-now-playing`, `youtube-lower-third`
- Data viz — `data-chart`, `flowchart`, `us-map`, `us-bubble-map`, `world-map`, `spain-map`
- Cinematic — `cinematic-zoom`, `app-showcase`, `iphone-macbook-3d-showcase`, `3d-ui-reveal`
- Effects — `liquid-glass`, `magnetic`, `portal`, `shatter`, `vfx-text-cursor`
- Full videos — `vpn-youtube-spot`, `blue-sweater-intro-video`, `nyc-paris-flight`, `apple-money-count`

**Components** (effects / snippets applied within a composition):
- Text effects — `editorial-emphasis`, `highlight`, `kinetic-slam`, `matrix-decode`, `neon-accent`, `neon-glow`, `pill-karaoke`, `weight-shift`, `texture-mask-text`
- Visual effects — `emoji-pop`, `glitch-rgb`, `gradient-fill`, `parallax-layers`, `particle-burst`, `grain-overlay`, `vignette`, `shimmer-sweep`

**Shader transitions** (GPU-powered scene transitions):
- 3D, blur, cover, destruction, dissolve, distortion, grid, light, mechanical, push, radial, scale
- Named: `cross-warp-morph`, `domain-warp-dissolve`, `flash-through-white`, `ridged-burn`, `ripple-waves`, `sdf-iris`, `swirl-vortex`, `thermal-distortion`, `whip-pan`, and more

---

## 6. Agent skills

HyperFrames ships agent skills installable via:

```bash
npx skills add heygen-com/hyperframes
```

These teach AI agents (Claude Code, Cursor, Gemini CLI, Codex, GitHub Copilot CLI) how to write correct compositions. In Claude Code they register as slash commands:

| Skill                | What it teaches                                            |
|----------------------|------------------------------------------------------------|
| `/hyperframes`       | Composition authoring — data attributes, structure, nesting |
| `/hyperframes-cli`   | Dev-loop commands — init, lint, preview, render             |
| `/hyperframes-media` | Asset preprocessing — TTS, transcription, background removal|
| `/tailwind`          | Tailwind v4 browser-runtime in `init --tailwind` projects   |
| `/gsap`              | Timeline animation — seekable, frame-accurate GSAP          |
| `/animejs`, `/css-animations`, `/lottie`, `/three`, `/waapi` | Alternative animation runtimes |

The CLI is agent-friendly by default: flag-driven inputs, parseable output, fail-fast on errors, no interactive prompts unless explicitly requested with `--human-friendly`.

---

## 7. The 7-step pipeline

HyperFrames defines a production pipeline for structured video creation:

```
capture → design → script → storyboard → VO+timing → build → validate
```

| Step           | Output                              | Description                                     |
|----------------|-------------------------------------|-------------------------------------------------|
| 1. Capture     | `capture/`                          | Extract assets, tokens, fonts from a source      |
| 2. Design      | `DESIGN.md`                         | Brand reference — colors, type, components       |
| 3. Script      | `SCRIPT.md`                         | Narration with hook, story, proof, CTA           |
| 4. Storyboard  | `STORYBOARD.md`                     | Per-beat creative direction                      |
| 5. VO + Timing | `narration.wav` + `transcript.json` | TTS audio with word-level timestamps             |
| 6. Build       | `compositions/*.html`               | Animated HTML compositions, one per beat         |
| 7. Validate    | Snapshot PNGs + lint/validate pass   | Visual verification before delivery              |

Not every project uses every step, but the order matters: durations come from narration, animation choices from the storyboard, the storyboard from the design reference.

---

## 8. The player web component

`@hyperframes/player` is a 3KB web component that embeds compositions anywhere:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@hyperframes/player"></script>

<hyperframes-player
  src="./my-composition/index.html"
  controls autoplay muted
  style="width: 100%; max-width: 800px; aspect-ratio: 16/9">
</hyperframes-player>
```

**Architecture**: iframe inside a Shadow DOM container. Composition CSS/JS is isolated from the host page. Auto-scales via CSS transforms.

**JavaScript API** mirrors `<video>`: `play()`, `pause()`, `seek(t)`, `currentTime`, `duration`, `paused`, `ready`, `playbackRate`.

**Events**: `ready`, `timeupdate`, `play`, `pause`, `ended`, `error`.

**Framework support**: React, Vue, or plain JS — just `import '@hyperframes/player'` and use the custom element.

---

## 9. HyperFrames vs Remotion

Key differentiators (relevant for VibeFrames' choice):

| Dimension                  | HyperFrames         | Remotion                |
|----------------------------|---------------------|-------------------------|
| Authoring surface          | HTML + CSS + GSAP   | React components (TSX)  |
| Build step                 | None                | Required (bundler)      |
| Agent compatibility        | Native (HTML = LLM's best format) | Requires JSX generation |
| GSAP / library animations  | Seekable, frame-accurate | Wall-clock during render |
| Visual editing             | Native (same DOM)   | Source is code + build  |
| Distributed rendering      | Single-machine      | Lambda (production-ready) |
| License                    | Apache 2.0          | Commercial              |

The bet that matters for VibeFrames: **agents already speak HTML**. An LLM can generate, modify, and validate HTML compositions without a build step or framework knowledge. This is the core reason HyperFrames is the rendering engine.

---

## 10. Where does an agent help?

This is the question VibeFrames answers. Given HyperFrames' HTML-native authoring model, an AI agent can multiply productivity at every stage:

### What the agent can do today (with HyperFrames skills)

- **Scaffold** — generate compositions from a text prompt
- **Author** — write correct `data-*` attributes, GSAP timelines, nested compositions
- **Lint & validate** — catch structural issues before render
- **Choose blocks** — select from the 50+ catalog based on intent
- **Animate** — write seekable GSAP/CSS/Lottie animations
- **Caption** — generate word-level captions from transcripts
- **Render** — trigger CLI render with correct flags

### What VibeFrames adds on top

- **Conversational editing** — "make the title bigger" → agent mutates the composition tree, UI shows the delta live
- **Composition as shared state** — both human (via timeline/properties UI) and agent (via tools) edit the same canonical JSON tree
- **Structured tool protocol** — not free-form "write HTML" but typed tools: `add-clip`, `update-clip`, `remove-clip`, `set-meta`, `validate-composition`
- **SSE-streamed feedback** — reasoning, tool calls, composition deltas streamed as discrete events
- **Memory** — agent remembers project context, style preferences, past edits across sessions

```
┌─────────────────────────────────────────────┐
│              VibeFrames                      │
│                                              │
│  ┌─────────┐     ┌──────────────────────┐   │
│  │  User   │────▶│  Mastra Harness      │   │
│  │  Chat   │◀────│  (Composer Agent)    │   │
│  └─────────┘ SSE │                      │   │
│                   │  tools mutate        │   │
│                   │  jsonTree            │   │
│                   └──────────┬───────────┘   │
│                              │               │
│                              ▼               │
│                   ┌──────────────────────┐   │
│                   │  Composition         │   │
│                   │  (canonical JSON)    │   │
│                   └──────────┬───────────┘   │
│                              │ serialize     │
│                              ▼               │
│                   ┌──────────────────────┐   │
│                   │  HyperFrames HTML    │   │
│                   └──────────┬───────────┘   │
│                              │               │
│                              ▼               │
│                   ┌──────────────────────┐   │
│                   │  <hyperframes-player>│   │
│                   │  (browser preview)   │   │
│                   └──────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

The agent doesn't replace HyperFrames — it wraps it. HyperFrames handles deterministic rendering; the agent handles intent-to-composition translation. VibeFrames is the bridge.

---

## 11. Key takeaways for VibeFrames

1. **No build step** — compositions are HTML files; hot-reload preview works out of the box.
2. **Player is embeddable** — `<hyperframes-player>` can live inside our React preview pane via CDN or npm import.
3. **Block catalog is a tool surface** — the agent can `search-blocks` and `add` from the catalog programmatically.
4. **GSAP animations are seekable** — the timeline UI can scrub animations frame-accurately.
5. **Nested compositions enable modularity** — each scene can be a separate file, composed into a master timeline.
6. **Agent skills exist but are file-level** — VibeFrames adds structured tools (typed Zod inputs/outputs) on top.
7. **Render is post-launch** — browser preview via player is the MVP; MP4 rendering via CLI is deferred.

---

## Next

- **M2** — Mastra primer: AI SDK → LLM → Agent → Tools → Workflows → Memory
- **M3** — Harness deep-dive: why, what, how
