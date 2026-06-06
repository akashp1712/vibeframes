# HyperFrames vs VibeFrames — Deep-Dive & MVP Roadmap

> **TL;DR** — VibeFrames sits at MVP 1.0 today: brief→storyboard→compose→validate runs end-to-end, the 20-block catalog produces valid HTML, validation is deterministic. The gap to HyperFrames is **motion doctrine** (transitions, entrance discipline, hard-kills) and **quality enforcement** (layout overflow, contrast, animation map). Both are surgical to import; we do not need HyperFrames' multi-pod / Remotion / avatar / multiplayer surface.
>
> Roadmap to MVP 5.0 is ~22 hours of focused work, broken across five releases. The framing — *"not having a good catalog is okay, but subpar quality from the existing catalog is not"* — is what this doc plans against.

**Source:** `.agents/skills/hyperframes`, `.agents/skills/hyperframes-registry`, `.agents/skills/hyperframes-cli`, `.agents/skills/website-to-hyperframes` vs `src/harness/`, `docs/harness-architecture.md`, `docs/meta/plan.md`.

---

## 1. Pack-by-Pack Inventory

### Pack 1 — `hyperframes/` (the core authoring guide)

The master rulebook for composition authoring. Teaches HTML-as-video-source, GSAP timeline discipline, layout-before-animation, the data-attribute vocabulary, and root vs sub-composition structure. SKILL.md is 489 lines + 16 reference docs (~3.4k more lines).

**Capabilities surfaced:**

- **Composition fundamentals** — `data-composition-id`, `data-start`, `data-duration`, `data-track-index`, `data-composition-src`, `data-composition-variables`, `data-width/height`.
- **Timeline contract** — paused GSAP timelines, `window.__timelines` registration, deterministic synchronous construction (no `await`, no `Math.random()`, no `Date.now()`).
- **Layout-before-animation** (HARD-GATE) — build static CSS that already looks right at the hero frame, then animate `.from()` those positions. Never animate to layout you haven't proven first.
- **Scene transition doctrine** — *non-negotiable* (SKILL.md L321–L348): ALWAYS transitions, ALWAYS entrance animations on every element, NEVER mid-scene exits, only the final scene may fade out.
- **Variables / parametrization** — typed (string / color / number / boolean / enum), declared on `<html>`, read via `window.__hyperframes.getVariables()`.
- **Typography at video scale** — 60px+ headlines, 20px+ body, 16px+ data labels, `font-variant-numeric: tabular-nums` on number columns.
- **Quality gates** — `npx hyperframes lint` (~60 rules), `validate` (WCAG AA contrast), `inspect` (headless-Chrome layout overflow with bounding boxes + fix hints), `animation-map` (ASCII Gantt of all tweens with stagger detection + dead-zone reporting).
- **Reference depth** — 16 markdown files: `video-composition`, `beat-direction`, `motion-principles`, `typography`, `transitions` + `transitions/`, `techniques` (13 primitives), `captions`, `audio-reactive`, `css-patterns` (highlight/circle/burst/scribble/sketchout), `text-effects`, `html-in-canvas-patterns` (~6 GPU effect recipes), `narration`, `prompt-expansion`, `design-picker`, `transcript-guide`, `dynamic-techniques` + 9 named palettes.

**Representative authoring excerpts:**

```html
<!-- root composition + variables -->
<html data-composition-variables='[
  {"id":"title","type":"string","label":"Title","default":"Hello"},
  {"id":"theme","type":"enum","label":"Theme","default":"light","options":[...]}
]'>
<body>
  <div data-composition-id="root" data-width="1920" data-height="1080">
    <div data-start="0" data-duration="3" class="clip">…</div>
```

```js
// entrance-only — transition handles the exit
tl.from("#s1-title",    { y: 50, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.3);
tl.from("#s1-subtitle", { y: 30, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.6);
// ❌ BANNED: tl.to("#s1-title", { opacity: 0 }, 6.5)  — empties the scene before transition fires

// hard-kill at scene boundary (motion-principles.md)
tl.to(el, { opacity: 0, duration: 0.3 }, beatEnd);
tl.set(el, { opacity: 0, visibility: "hidden" }, beatEnd + 0.3);
```

### Pack 2 — `hyperframes-registry/`

Component + block registry: how reusable atoms are authored, discovered, and wired. Schema overlaps almost 1:1 with our `HyperFramesBlock` interface.

- Component schema — `id`, `name`, `tags`, `template`, `props`, `preview`.
- Discovery — `npx hyperframes catalog [--tag caption-style]`.
- Install — `npx hyperframes add <block-id>` registers a block in the project.
- Wiring — `<div data-composition-src="path">` auto-nests timelines, scopes CSS.
- Variable inheritance — parent passes `data-variable-values`, child reads via `getVariables()`.
- Patterns — text-effects, captions, data-viz, device mockups (51 blocks + 4 components + 8 examples in the official registry).

### Pack 3 — `hyperframes-cli/`

Dev-loop and render automation (~25 commands).

**Authoring:** `init`, `add`, `catalog`, `play`, `preview`, `publish`.
**Render:** `render --output video.mp4` (NVENC / VideoToolbox / VAAPI, HDR PQ/HLG, ProRes for transparency).
**Lint:** ~60 rules — overlapping clips, missing timelines, async construction, banned eases, `Math.random()`, `Date.now()`, `repeat:-1`.
**Validate:** WCAG AA contrast (4.5:1 normal / 3:1 large) at 5 sampled timestamps.
**Inspect:** seek through timeline in headless Chrome, report overflows with selector + bounding-box + fix hint.
**Snapshot:** `--at 1.5,4,7.25` extracts hero frames.
**Media:** `tts` (Kokoro: 54 voices, 9 langs, local), `transcribe` (Whisper.cpp / Groq / OpenAI), `remove-background` (u2net).

### Pack 4 — `website-to-hyperframes/`

Closest analog to our pipeline — the seven-step workflow that turns a website into a broadcast-quality video. The reference architecture for how a serious composition is built.

**Steps:** `0-capture` → `1-design` (DESIGN.md) → `2-brief` (gate 💬) → `3-storyboard` + script (gate 💬) → `4-vo` (TTS + timing, gate 💬) → `5-build` (HTML per beat, brand adherence) → `6-validate` (lint + validate + inspect zero-error).

**`capabilities.md`** is the master inventory (713 lines) — 24 sections covering: 6 deterministic animation engines (GSAP + 15 plugins, Anime.js v4, CSS keyframes, WAAPI, Lottie, Three.js), 14 WebGL shader transitions, 30+ named CSS transitions, 15 caption components, audio-reactive frequency mapping, HTML-in-Canvas, variable fonts, MotionPath, audio mixer, the player web component, the engine + producer (MP4/WebM/MOV/PNG), the studio NLE.

---

## 2. VibeFrames Today (MVP 1.0 Snapshot)

### Pipeline phases

| Phase | What it emits | Tools | State written |
|---|---|---|---|
| **Brief** | message, arc, audience, format, durationMs, narration, styleNotes, brand{name, primaryColor, accentColor, fontFamily} | `commit-brief` | `brief` |
| **Storyboard** | beats[]: concept, shotType, cameraMove, techniques[≥2], blockHints[], voCue, durationMs (∑ ≈ brief.durationMs ± 500ms) | `propose-storyboard`, `commit-storyboard`, `revise-beat` | `storyboard` |
| **Compose** | per beat: bg-fill clip + primary block clip + optional overlay → mutations on composition tree | translator + `add-clip` | `composition` |
| **Validate** | 8 deterministic rules → report (severity, fix hint) | `validate-composition` | `validationReport` |

`src/harness/director/agent.ts` resolves all tools at once (Mastra dynamic-tools refresh once per `sendMessage`, not per step), and per-tool `execute()` guards out-of-phase calls.

### Block catalog (20 entries, `src/harness/services/clip-registry.service.ts`)

**Tier 1a — atomic 3-clip pattern (basis for most scenes):** `background-fill` ✅ · `logo-headline` ✅ · `subtitle-anchor` ✅
**Tier 1b — single-clip compositions:** `hero-title` ✅ · `lower-third` ✅ · `split-screen` ✅ · `cta-button` ✅ · `end-card` ✅ · `stats-callout` ✅ · `quote-pull` ⚠️ (no overflow handling) · `kinetic-words` ⚠️ (locked at 8xl)
**Tier 1c — social overlays:** `social-avatar` ⚠️ · `mention-card` ⚠️ · `hashtag-pill` ⚠️ · `comment-bubble` ⚠️ · `like-counter` ⚠️ — all hard-coded anchors
**Tier 1d — CTAs:** `follow-button` ✅ · `follow-arrow` ✅
**Tier 1e — full-frame overlays:** `grain-overlay` ✅ · `scanlines-overlay` ✅

### Translator (`src/harness/composition/translator.ts`)

- **Block selection:** composition-kind hint → unit hint → concept regex (`/\d+%|\d+x|\d+×|metric|callout|stat/`, `quote|testimonial`, `cta|call.to.action`) → position-aware (first→hero-title, last→end-card) → shot-type fallback.
- **Variable resolution:** `hero-title` prefers `brand.name` → `headlineFromMessage(brief.message)` → `voCue` → `"Hello"`. Brand color: `safeHexColor(...) ?? lookupBrand(...)?.primaryColor ?? DEFAULT_BRAND.primaryColor`.
- Missing required vars get sensible defaults — translator never fails mid-pipeline.

### Director skills (5 markdown files in `src/harness/director/skills/`)

`workflow/skill.md` (READ FIRST) · `brief/skill.md` · `storyboard/skill.md` · `design/skill.md` · `validate/skill.md`.

### Validation (8 deterministic rules, `validation-rules.ts`)

`beatIndex-sequential` · `beat-duration-positive` · `beat-concept-nonempty` · `beat-techniques-count` (≥2) · `storyboard-duration-acceptable` (±500ms of brief) · `beat-built-by-index` · `primary-clip-duration` · `no-overlapping-clips`.

---

## 3. Side-by-Side Capability Matrix

| Capability | HyperFrames | VibeFrames | Gap |
|---|---|---|---|
| **Scene transitions** | 14 shaders + 30+ CSS patterns + linter enforcement | None — clips play back-to-back | **CRITICAL** |
| **Entrance choreography** | Required on every element; enforced by lint | Blocks ship static HTML; no GSAP emitted | **CRITICAL** |
| **Mid-scene exit ban** | Linted | Not checked | **CRITICAL** |
| **Layout overflow audit** | `hyperframes inspect` (headless Chrome, bounding boxes, fix hints) | Not implemented | High |
| **Contrast audit** | `hyperframes validate --wcag` (AA, 5 timestamps) | Not implemented | High |
| **Animation map / choreography** | ASCII Gantt + stagger detection + dead-zone flags | Not implemented | Medium |
| **Captions / subtitles** | 15 components, tone detection, per-word karaoke, hard-kill exit | Not implemented | High (for MVP 3.0) |
| **Audio-reactive** | Band extraction → mappable to any GSAP property | Not implemented | Medium |
| **HTML-in-Canvas heroes** | Boilerplate + 7 recipes (iPhone/MacBook mockups, liquid glass, magnetic, portal, shatter, text cursor) | Not implemented | Medium (for MVP 4.0) |
| **Three.js / WebGL** | Full integration (`hf-seek`, AnimationMixer, GLTF, post-processing) | Not implemented | Low |
| **Sub-compositions** | `data-composition-src` auto-nests timelines, scopes CSS | Not used (one-level tree only) | Low |
| **Variable fonts / kinetic type** | Variation-axis tweens, character typing, MotionPath | Not in blocks | Low |
| **Design.md / brand kit** | Full system (colors, fonts, do's/don'ts, component treatments adapted for video) | `brief.brand` has fields; no DESIGN.md import | Medium (MVP 5.0) |
| **Font handling** | Built-in font list + custom `.woff2` loading + warn-on-missing | Agent inherits whatever; translator doesn't `@font-face` | Medium |
| **Palette extraction from website** | `step-0-capture` reads screenshot, suggests palette | Not implemented | Low |
| **Narration / TTS** | Kokoro local, 54 voices, 9 langs | Not implemented (M11) | Low |
| **Transcription** | Whisper.cpp / Groq / OpenAI; SRT/VTT/JSON | Not implemented | Low |
| **Linter (~60 rules)** | Yes | 8 rules, all schematic (no GSAP linting since no GSAP) | High |
| **Render** | MP4/WebM/MOV/PNG, GPU encode, HDR | Out-of-scope (MVP) | — |

---

## 4. Specific Quality Gaps in Today's Output

### 4.1 No transitions architecture

`translator.ts` emits clips with `data-start` and `data-duration`, but the composition HTML has no transition wiring (no shader call, no CSS crossfade, no opacity ramp at boundaries). Result: every multi-beat composition is a series of jump cuts. HyperFrames calls this a broken composition (SKILL.md L321: *"ALWAYS use transitions between scenes. No jump cuts. No exceptions."*).

### 4.2 No entrance discipline

Block templates ship static markup — `hero-title`'s template is `<h1>{{title}}</h1>` inside a layout div. No `<script>`, no GSAP, no `tl.from()`. The agent has no place to inject entrance choreography because the translator never emits a `<script>` block tied to the clip. Compare HyperFrames: every element animates IN, with at least 3 different eases per scene.

### 4.3 Translator silent fallbacks

- **Brand color sanitization:** `safeHexColor(brief.brand.primaryColor)` returns `null` on malformed input, the brand-accent `<div>` is dropped, and there is no warning surfaced. Composition renders without the brand line; user can't tell why.
- **Missing var → placeholder:** if `beat.voCue` is null and `brief.message` is empty, `varsForBlock` for `hero-title` falls through to `"Hello"`. The composition renders, validation passes clean, the copy is still wrong.
- **`stats-callout` regex narrow:** matches `\d+%`, `\d+x`, `metric`, `callout`, `stat` — misses "double", "triple", "5K downloads", "ARR". Beats that should be a number-callout get downgraded to `split-screen`.
- **`isFirst && isLast` ambiguity:** for a 1-beat composition, `pickPrimaryBlock` returns `hero-title` (first wins). Fine, but undocumented.

### 4.4 Hard-coded social overlay anchors

`social-avatar` (`top-10 left-10`), `mention-card` (`right-10 bottom-10`), `like-counter` (`right-10`) all hard-code position. `subtitle-anchor` already shows the right pattern (anchor enum: top/center/bottom). The other overlays should follow.

### 4.5 No `fitTextFontSize`

`kinetic-words` is locked at 8xl; `quote-pull` has no max-width or dynamic sizing. Long copy overflows. HyperFrames ships `window.__hyperframes.fitTextFontSize(text, { maxWidth, fontFamily, fontWeight })` for exactly this case — VibeFrames doesn't expose anything similar.

### 4.6 No layout / contrast audits

Without an `inspect` analog, text overflow is invisible until the user runs the composition in the browser. Without a `validate` analog, low-contrast text on dark gradients ships silently. Both are deterministic checks we could run server-side from the rendered HTML.

### 4.7 Validation doesn't catch any of the above

The 8 deterministic rules are schema-checks (durations, indices, overlaps). They confirm the composition is well-formed — they do not check that it is **good**.

---

## 5. MVP Roadmap Recommendations

User's framing as the optimization function: *small surface, working catalog, climbing quality*.

### 5.1 — MVP 1.0 stabilization (one session, ~2h)

Close the silent-failure surface so today's catalog stops shipping subpar output.

| Item | Effort | Path |
|---|---|---|
| Surface `safeHexColor` rejection in validation report | S | `commit-brief` warns when LLM hex was rejected; add to `validationReport.notes` |
| `rule_varSubstitutionFallback` validation rule | S | Translator records when a var fell through to a placeholder; rule warns per occurrence |
| Refactor 5 social overlays to use `anchor` var (mirror `subtitle-anchor`) | M | Edit 5 templates, add anchor enum, update translator's overlay-pick logic |
| Broaden `stats-callout` keyword routing | S | Extend regex to "double", "triple", "K downloads", "ARR", "MAU", spelled-out numbers |
| Document 1-beat composition path in `design/skill.md` | XS | One paragraph |

**Acceptance:** prompt → composition → validation report shows zero placeholder fallbacks for non-trivial inputs; brand colors land on every composition or surface a clear warning; positioned overlays land where the storyboard intended.

### 5.2 — MVP 2.0 Explainer (2 sessions, ~4h)

Multi-beat compositions feel like videos, not slideshows. The single highest-impact import from HyperFrames.

| Feature | HF source | VF port | Effort |
|---|---|---|---|
| **CSS crossfade transitions** | `transitions.md` (blur-crossfade, zoom-through, push-slide) | Translator emits a `<style>` block per composition + GSAP scenes that fade `[data-clip-id]` ranges. Beat-level `transition` field in storyboard | M |
| **Entrance choreography boilerplate** | `motion-principles.md` + `techniques.md` | Each block template gets a paired `<script type="module">` snippet that runs `tl.from(...)` on its named children. Translator stitches them. Stagger 0.08s, 3 eases per scene | M |
| **Hard-kill at scene boundary** | `motion-principles.md` | Translator wraps each clip in opacity:0 + visibility:hidden after `data-duration` so cross-scene bleed is impossible | S |
| **Layout overflow audit (lite)** | `hyperframes inspect` | Server-side: spawn headless-Chrome, seek to each beat's hero frame, measure scrollWidth/scrollHeight per `data-clip-id` subtree, warn when content exceeds box | L (stretch) |
| **Contrast audit (lite)** | `hyperframes validate` | Sample 5 timestamps, screenshot via headless Chrome, sample background pixels behind every text node, compute WCAG AA, warn <4.5:1 | L (stretch) |

**Minimum scope to call MVP 2.0 done:** transitions + entrances + hard-kill = M + M + S. Audits are stretch goals.

**Acceptance:** 30s explainer composition has visible (and configurable) transitions between every beat; every text element animates in; no element bleeds into the next scene's frame.

### 5.3 — MVP 3.0 Social (2 sessions)

| Feature | HF source | VF port | Effort |
|---|---|---|---|
| Portrait format pass + tested | `video-composition.md` | Already declared in brief.format; verify all 20 blocks render correctly at 1080×1920; fix anchors | S |
| Auto-captions from `brief.narration` | `captions.md` | If narration ≠ "none", agent emits a beat-level `voCue`; translator emits captions clip on track-3 with per-word spans | M |
| Tone-aware caption styles | `captions.md` (hype / corporate / tutorial / storytelling / social) | Pick caption-style block based on `brief.arc`; ship 3 caption styles first (karaoke, pillow, slam) | M |
| Audio-reactive accent (optional) | `audio-reactive.md` | New optional `brief.audioReactive: { intensity, target }`; translator emits boilerplate that maps band amplitude to scale/glow on a target selector | L |

### 5.4 — MVP 4.0 Cinematic (2 sessions)

| Feature | HF source | VF port | Effort |
|---|---|---|---|
| 3 shader transitions (sdf-iris, domain-warp, whip-pan) | `transitions/catalog.md` + `@hyperframes/shader-transitions` | Vendor the 3 shaders; new `transition: { kind: "shader", id, intensity }` field on beats; route at compose | L |
| 2 device-mockup blocks (iPhone, MacBook) | `html-in-canvas-patterns.md` | Add `vfx-iphone`, `vfx-macbook` blocks; wire `layoutSubtree` capture; document Chrome-only fallback | L |
| Liquid-glass overlay block | `html-in-canvas-patterns.md` (liquid example) | Add `vfx-liquid-glass` overlay block with vertex-shader displacement | M |

### 5.5 — MVP 5.0 Brand-Kit (2–3 sessions)

| Feature | HF source | VF port | Effort |
|---|---|---|---|
| `import-design-md` tool | `step-1-design.md` | Tool reads a DESIGN.md path, parses sections (palette, type, corners, density, depth, avoid), fills `brief.brand` + `styleNotes` | M |
| Custom font loading | `typography.md` | If `brief.brand.fontFamily` is a path, translator emits `@font-face` referencing the user-supplied `.woff2`; otherwise stays in built-in list | M |
| Palette extraction from website screenshot | `step-0-capture.md` | Tool: take URL → headless screenshot → 5 dominant colors via k-means → propose to brief | L |
| Contrast-aware palette suggestions | `validate.md` | When contrast audit flags <4.5:1, suggest lighter/darker variant in same hue family | M |

### Effort summary

| MVP | Scope | Sessions | Cumulative |
|---|---|---|---|
| 1.0 | shipped | 0 | — |
| 1.0.1 | silent-failure cleanup | 1 (~2h) | 2h |
| 2.0 | transitions + entrances + hard-kill | 2 (~4h) | 6h |
| 3.0 | portrait + captions + audio-reactive | 2 (~4h) | 10h |
| 4.0 | shader transitions + device mockups + liquid glass | 2 (~4h) | 14h |
| 5.0 | DESIGN.md import + fonts + palette extraction | 2–3 (~6h) | ~20h |

---

## 6. Anti-Recommendations (skip these)

1. **Remotion integration** — VibeFrames is HTML+GSAP-deterministic already. Adds Playwright frame loop + node graph for no MVP value. If we ship MP4 render later, build a thin HyperFrames-CLI bridge, not a Remotion port.
2. **Observational memory + reflector** — Mastra Memory's observer/reflector is for long-context multi-turn projects. VibeFrames is single-shot. M-future at earliest.
3. **Multi-pod state (Redis-backed)** — out-of-scope per `docs/meta/plan.md` §4. Cold-start is fine for MVP.
4. **HeyGen avatar block** — explicitly out-of-scope. Avatars belong in post-render, not composition authoring.
5. **Multiplayer / collab** — single-user studio.
6. **MCP server** — VibeFrames is web-first.
7. **Full 60-rule linter** — match the surface to ours: lint what we emit. Don't import rules for `Math.random()`, async timeline construction, or GSAP misuse until we actually emit GSAP.
8. **Three.js full integration** — overkill for MVP 4.0; we only need it for 2–3 hero blocks via HTML-in-Canvas, not as a first-class adapter.

---

## 7. Surgical Imports to Write Down Now

Even before MVP 2.0 lands, these doctrinal lines from HyperFrames belong in our `design/` and `storyboard/` skills today. They cost nothing, and they'll prevent the agent from authoring beats that won't survive a transitions-aware translator:

- *"Every element animates IN. No element appears fully-formed."* (motion-principles)
- *"NEVER use exit animations except on the final scene. The transition IS the exit."* (SKILL.md L327)
- *"Vary eases across entrance tweens — use at least 3 different eases per scene."* (SKILL.md L353)
- *"60px+ headlines, 20px+ body, 16px+ data labels for rendered video. `font-variant-numeric: tabular-nums` on number columns."* (SKILL.md L356)
- *"Build static CSS first at the hero frame. Animate FROM/TO those positions — never animate to layout you haven't proven."* (layout-before-animation HARD-GATE)
- *"Every beat is a WORLD, not a layout."* — already in our storyboard skill; pair with HF's *"speed = weight: faster motion reads as urgency, slower as importance"* (motion-principles).

---

## 8. Conclusion

The brief — *"MVP 1.0, MVP 2.0 progress, working catalog over feature breadth"* — is met today and has a clear runway.

- **MVP 1.0 is shipped.** The pipeline runs end-to-end, the 20-block catalog produces valid HTML, validation is deterministic.
- **The largest quality gap is motion doctrine** (transitions + entrances + hard-kills), not feature count. One focused session closes silent failures; two more close the motion gap.
- **HyperFrames imports are surgical, not wholesale.** Bring the doctrine and the technique recipes; skip the multi-pod / Remotion / avatar / multiplayer surface.
- **Five releases, ~20 hours, takes us to a brand-kit-aware studio.** Each release is independently shippable and externally legible (explainer → social → cinematic → brand-kit).

Next concrete action: start MVP 1.0.1 — surface `safeHexColor` rejection, add the var-fallback validation rule, refactor social overlay anchors, broaden the stats-callout regex.
