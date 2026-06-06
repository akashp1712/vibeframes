# Future Roadmap — Backlog

Loose backlog of ideas captured post-M9. Not committed milestones — just thoughts to come back to.

## Asset Pipeline

### Phase 1 — User-uploaded assets

Let users bring their own images and audio into a composition.

- **Upload UI** in the studio sidebar (drag-drop zone, or "+ Asset" button).
- **Asset library service** in `src/harness/services/asset-library.service.ts`:
  - `uploadAsset(file: File) → { assetId, url, type, name, metadata }`
  - `listAssets(projectId) → Asset[]`
  - Storage: Vercel Blob to start, swap for S3 later.
- **New tool: `list-assets`** — exposes uploaded assets to the agent (with descriptions + URLs) so it can reference them in clip HTML (`<img src="...">`, `<audio src="...">`).
- **Supported types**: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `audio/mpeg`, `audio/wav`, `audio/ogg`.
- **Cap**: 10MB images, 50MB audio, 20 assets per project (tune later).

### Phase 2 — AI generation

Replace "upload" with "generate" where it makes sense.

- **Image generation tool** — `generate-image({ prompt, aspectRatio, style })`:
  - Provider candidates: Vercel AI Gateway's image models, FAL, Replicate.
  - Returns a CDN URL the agent can drop into a clip's `<img src=...>`.
  - Cache by prompt hash to avoid re-billing.
- **Voice / narration tool** — `generate-voice({ text, voiceId, model })`:
  - ElevenLabs first (industry-standard quality, large voice library).
  - Returns an audio URL the agent can drop into an `<audio>` clip.
  - Per-project usage quota.
- **Music / SFX tool** (later) — `generate-music({ mood, duration })` via Suno or Stable Audio.

### Phase 3 — Smart asset suggestion

Agent proactively suggests assets when a clip would benefit:

- "I'll add a hero image here — should I generate one ('cinematic vercel triangle on black') or pick from your uploaded assets?"
- Surfaces both options as `ask_user` (once we move off Vercel serverless for real human-in-the-loop).

## Brand Compliance

Let the user pin a brand spec the agent must follow when composing clips.

### MVP — design.md upload / pointer

- **Input modes**:
  1. Upload a `design.md` file in the studio onboarding.
  2. Paste a public URL to a Markdown file.
  3. Point to a GitHub raw URL with a token (private repos).
- **Storage**: per-project `brandMarkdown` field on `VibeFramesState`, mirroring mc-studio-services' `brandMarkdown` / `briefMarkdown` pattern.
- **Hydrate at boot**: when `getVibeFramesHarness` initializes, fetch + cache the brand. Inject into the system prompt via `buildDirectorPrompt(brandMarkdown)` — same pattern as `mc-studio-services`'s `buildVibePrompt`.
- **New tool: `get-brand`** — returns the current brand markdown so the agent can re-read it mid-conversation. Always fresh.

### Phase 2 — structured brand kit

Beyond a single markdown blob, support a structured shape so we can validate compliance:

```ts
interface BrandKit {
  colors: { primary: string; secondary: string; accent: string; ... };
  fonts: { heading: string; body: string; mono?: string };
  voice: { tone: string; bannedWords: string[]; preferredTerms: { from: string; to: string }[] };
  logos: { primary: AssetRef; secondary?: AssetRef; favicon?: AssetRef };
  guidelines: string; // free-form markdown
}
```

- Studio surface to edit/preview the brand kit.
- Validator service (`brand-validator.service.ts`) checks each `add-clip` HTML against the kit — flag banned colors, off-brand fonts.
- Pipe validator output into a `content.validate` event (mirror mc-studio-services' email/SMS validator pattern).

### Phase 3 — auto-style from brand

When a brand kit is loaded, push it into the agent's tool layer:

- New tool: `apply-brand-styles({ html })` — rewrites raw HTML to use brand colors/fonts.
- Or: surface brand tokens as Tailwind classes in the clip registry, so the agent gets "brand-primary" / "brand-heading-font" pre-baked.

## Other thoughts (parking lot)

- **Render to MP4** — server-side render of the HyperFrames composition via headless Chromium + ffmpeg. Could outsource to a service like Shotstack or run Remotion server-side.
- **Templates marketplace** — pre-made `BrandKit + skill.md + asset pack` bundles users can fork.
- **Multi-mode harness** — Director (high-level) + Editor (precise nudge/trim/swap) + Director-of-Photography (style/look transfer).
- **Workspace skills per project** — let users add their own `skills/` (e.g. `gsap-advanced/skill.md`) without forking the repo. Probably needs durable storage first.
- **Persistence** — replace `InMemoryStore` with LibSQL / Postgres so compositions survive cold starts.
- **Reconnection** — resume SSE stream from `seq` after a drop. Requires durable harness state.

## Decisions still to make

- **Storage**: Vercel Blob for assets, but what for harness state? LibSQL (Turso) is the cheapest dev fit; Postgres+Drizzle scales further.
- **Auth**: M9 has no auth. When assets land we need at least anonymous-with-cookie sessions, or full Clerk/Auth.js.
- **Rate limiting**: image gen + voice gen will be expensive — need per-IP / per-user caps.

---

## Harness / Agent Learning Checklist

A focused list of Mastra-Harness capabilities we want to **deep-dive, experiment with, and ship**. Each is a learning beat as much as a product feature — we want to understand the primitive, prove it with a tiny experiment under `experiments/`, then graduate the pattern into `src/harness/`.

Mark items: `[ ]` open · `[~]` exploring · `[x]` shipped.

### M10 candidates (current milestone)

#### `[~]` 1. Broaden HyperFrames catalog — more blocks, skills, tools

The HyperFrames docs in `.agents/skills/hyperframes-*` already define a rich vocabulary; we're growing our catalog *up* through three tiers.

**Tier 1 — Static inline blocks + transitions (today, no architecture change)**
- `src/harness/services/clip-registry.service.ts` — Tailwind HTML fragments with `{{slot}}` vars. Every block has a `kind: "unit" | "composition"` so the agent knows whether to layer it or use it standalone.
- `src/harness/services/transition-registry.service.ts` — sibling registry for clip transitions, with its own tools (`add-transition`, `get-transition-schemas`) and skill (`skills/transitions/skill.md`).
- **Status**: **20 blocks shipped** — 3 atomic units + 7 compositions + 1 lower-third unit + 5 social units + 2 follow units + 2 effect-overlay units. Categories now span backgrounds, titles, lower-thirds, scenes, stats, quotes, CTAs, end-cards, social, follow, and effect-overlay. **23 transitions catalogued** — **18 Tier 1** (cut, fade, fade-through-black/white, slide-left/up/stack, zoom-in/out, zoom-punch-in/out, wipe-circle, wipe-diagonal, **wipe-checker**, **iris-open**, **iris-close**, blur-bridge, **glitch-cut**) + 2 Tier 2 stubs (morph-shapes, morph-type) + 3 Tier 3 VFX stubs.
- **Next here**: the Tier 1 inline-template surface is essentially saturated — every remaining Tier 2 (morph-*) needs SVG path tweening, which belongs in the Tier 2 sub-composition architecture (`add-block { blockId, vars }`) rather than promoted in place. Net catalog growth from here means **new** block / transition categories or **deeper** sub-composition entries, not more promotions.

**Tier 2 — Sub-composition blocks with GSAP timelines (next architecture step)**
- Source: `.agents/skills/hyperframes/references/techniques.md` (13 techniques), `patterns.md` (PiP, text-behind-subject, title-card-fade, slide-show).
- **Blocked on**: `add-clip` today only accepts inline `html`. To run real HyperFrames blocks we need it to also accept `data-composition-src` references to standalone HTML files that own their `<script>` + GSAP timeline.
- **Effort**: Medium. Composition-store changes + a new tool variant (`add-block { blockId, vars }`) that materialises a sub-composition file on disk and references it. The director then picks from a richer registry without seeing the raw HTML.
- **First targets**: SVG path-drawing logo reveal · per-word kinetic typography · character-by-character typewriter · clip-path reveal masks.

**Tier 3 — Registry VFX blocks (`hyperframes add <name>`)**
- Source: `.agents/skills/hyperframes-registry/`. Library includes `vfx-magnetic`, `vfx-shatter`, `vfx-liquid-background`, `vfx-portal`, `vfx-iphone-device`, `data-chart`, `grain-overlay`, `shimmer-sweep`, terminal/device mockups.
- **Blocked on**: Tier 2 *plus* an install pipeline — running `hyperframes add` against the project or shipping the registry items as part of our package.
- **Effort**: Medium-high. Mostly tooling: a `register-vfx-block` step at boot that lists what's available + extending the agent's tool surface to know each block's parameters.

**Why interesting (the learning angle)**: Most of the agent's intelligence is encoded in the *catalog*, not the prompt. Each tier we climb cuts the agent's token budget for "describe a scene" while expanding what it can actually produce — and Tier 2/3 unlock real motion design (GSAP timelines, WebGL effects) that flat HTML can't express.

**Mastra primitives**: Skill markdown frontmatter + tool schemas (Zod) + new composition tools per tier. Tier 2 also opens the door to **prompts that reference catalog entries by id** instead of asking the LLM to author motion code — that's where item #2 (cost optimisation) intersects.

**Spike cadence**: one tier-1 block per build session; spike tier-2 architecture once we have 3+ patterns the catalog can't currently express.

#### `[ ]` 2. Cost-optimised generation — programmatic blocks + LLM-styled copy
- **What**: Instead of asking the LLM to produce raw HTML, have it emit a **typed block reference** plus **style tokens** and **copy** (e.g. `{ block: "hero-title", copy: { headline: "Launch.", subtitle: "…" }, style: { palette: "warm-peach", motion: "fade-up" } }`). Our composer assembles the actual HTML server-side from a registered template + Tailwind classes.
- **Why interesting**: Massive token reduction — generation cost drops from ~800 tokens per clip to ~120. Plus deterministic output → fewer broken clips, free brand consistency, simpler validation.
- **Mastra primitives**: typed tool schemas (Zod) for block-references; composer mode runs *after* director and assembles templates.
- **Effort**: Medium. Needs (a) block-template registry, (b) tool schema rework, (c) prompt update so the director emits references not HTML.
- **Risk**: Quality regression if templates are too rigid. Mitigate with a "free-form HTML escape hatch" tool for unusual clips.
- **Spike**: build 2–3 templates, A/B them against the current free-form path, compare token cost + quality.

> **Verdict on M10 fit**: Item 1 is a clear M10 fit — it's additive, low-risk, advances the core value prop. **Item 2 should start as a research spike during M10 and ship in M11.** It's a meaningful rework of the composer's contract; doing it half-baked risks slipping M10. Treat M10 as the place we *prove* the spike, not where we ship the rewrite.

### Post-M10 (M11+)

#### `[ ]` 2a. Captions — registry, tools, skill, renderer

- **What**: Add captions as a first-class layer alongside clips and transitions. New `caption-registry.service.ts`, `add-caption-cue` / `get-caption-styles` tools, `skills/captions/skill.md`, and a `CaptionTrack` field on the Composition model. Three Tier 1 styles (`caption-classic`, `caption-tiktok`, `caption-bold-accent`) ship first; kinetic / typewriter / bilingual queue as Tier 2 stubs.
- **Why interesting**: Short-form social video lives or dies on captions (~80% silent watching). Adopting captions turns VibeFrames from "make a clip" into "make a clip that converts on a phone".
- **Plan**: see `docs/lld/lld-07-captions.md` — model, registry, tools, three-phase pipeline (pre-timed → script-splitter → audio-aligned), and adoption order C1–C5.
- **Effort**: Medium. C1 ships entirely as track-overlay clips (no renderer change); C3+ needs a first-class caption layer (post Studio Tier A).

#### `[ ]` 2b. `@hyperframes/studio` adoption — Player, Timeline, Inspector

- **What**: Adopt the official `@hyperframes/studio` React components in slices — Player + TransportControls first, then Timeline, then ClipInspector — instead of hand-rolling everything around the iframe.
- **Why interesting**: Catalog growth pushes the Studio chrome to do more (scrubbing, multi-track editing, drag/drop, per-clip property panels). Adopting the Studio package once it exists is cheaper than re-building each piece.
- **Plan**: see `docs/lld/lld-06-studio-adoption.md` — four tiers (A: Player, B: Timeline, C: Inspector, D: EditorShell), each with pre-reqs, risks, and conflict-resolution policies for user-vs-agent edits.
- **Effort**: Tiered. Tier A is small (1–2 sessions); each subsequent tier compounds value. Tier C requires a model migration (clips carry `blockId + vars`, not just rendered `html`) which dovetails with item #2 (cost-optimised generation).

#### `[ ]` 3. Harness observability
- **What**: Wire up Mastra's tracing/telemetry — per-run timeline of state transitions, tool calls, LLM calls (with token counts and latency), SSE events emitted. Surface in a `/studio/runs/[runId]` debug pane.
- **Why interesting**: Critical for agent dev — without traces you're flying blind on regressions, prompt drift, slow tools. Also a great learning surface for "what's the agent actually doing?".
- **Mastra primitives**: `Telemetry`, `Tracer`, OpenTelemetry export (Mastra supports OTel exporters).
- **Effort**: Medium. Backend wiring is cheap; the UI to make traces *useful* is the bulk of the work.
- **Stretch**: hook into Langfuse or Braintrust for hosted traces.

#### `[ ]` 4. Working memory + compaction
- **What**: Beyond raw thread persistence, give the harness a typed *working memory* (e.g. "user prefers warm palettes", "current brief: 30s launch teaser"). Compact old messages into summaries when threads grow long so we don't blow context windows.
- **Why interesting**: This is where agents become *stateful* in a useful sense. Compaction is where the LLM-savings story compounds — long sessions stay cheap.
- **Mastra primitives**: `@mastra/memory` working-memory schemas + custom processors; `Memory` thread compaction hooks.
- **Effort**: Medium-high. Schema design + eval to make sure compaction doesn't lose intent.
- **Tie-in to item 2**: working memory should hold the *brand kit* and *block preferences* once Brand Compliance lands.

#### `[ ]` 5. Evals
- **What**: A small eval harness that runs deterministic prompts against the agent and asserts on the resulting composition (e.g. "given prompt X, expect a track-bg clip of 0–3s with a hero-title block"). Run in CI on every PR to the harness layer.
- **Why interesting**: Without evals, every prompt change is a leap of faith. With evals, prompt engineering becomes a science. This is *the* unlock for prompt iteration.
- **Mastra primitives**: Mastra has an `@mastra/evals` package — start there. Pair with a tiny in-repo runner if needed.
- **Effort**: Low to start (5–10 hand-picked cases) → medium as the suite grows. Use a cheaper model in eval mode.
- **Decision**: probably start with a `tests/evals/` directory rather than colocating, since these are slow and need separate CI orchestration.

#### `[ ]` 6. Prompt injection defence via input processors
- **What**: Mastra's `inputProcessor` hook lets us run a guard *before* the user message hits the LLM. Strip / flag / refuse messages that contain injection attempts ("ignore previous instructions…", embedded system-prompt overrides, suspicious markdown).
- **Why interesting**: VibeFrames will eventually accept brand briefs, asset metadata, and uploaded text — all classic injection vectors. Learning the input-processor pattern now is cheap insurance.
- **Mastra primitives**: `inputProcessor` middleware; can be a regex pre-filter or a tiny dedicated LLM classifier.
- **Effort**: Low.

#### `[ ]` 7. PII detection
- **What**: Detect and redact PII (emails, phone numbers, names) in user prompts before they hit the LLM provider, or at minimum before they're logged. Pair with item 6 as a sibling input processor.
- **Why interesting**: Most teams skip this until a customer asks. Doing it early is a posture statement and a learning beat for compliance-adjacent agent work.
- **Mastra primitives**: same `inputProcessor` hook; combine with a PII detector (e.g. `compromise`, `microsoft/presidio` via API, or a small regex pack).
- **Effort**: Low-medium. Detection is easy; deciding the *policy* (redact vs refuse vs warn) is the design work.

### Other capabilities to study (parking lot)

- `[ ]` **`ask_user` tool** — graceful human-in-the-loop pause/resume. Needs durable runs first.
- `[ ]` **Mode transitions** — full director → composer → critic loop with deterministic handoffs.
- `[ ]` **Tool retry + circuit breaker** — what happens when `add-clip` returns an invalid composition? Mastra has retry primitives worth learning.
- `[ ]` **Skill composition** — multiple skills loaded conditionally based on the brief (e.g. "social-media" skill + "brand-A" skill).
- `[ ]` **MCP integration** — expose VibeFrames as an MCP server so other agents can compose videos.
- `[ ]` **Multimodal tools** — vision input on the brief ("here's a screenshot of the vibe I want").

### How we work the checklist

1. **Pick one item per build session** (or per week). Mark `[~]`.
2. **Spike in `experiments/<feature-name>/`** — minimal reproduction first. No production wiring.
3. **Journal the learning** in `docs/journal/session-NN.md` — what worked, what didn't, what Mastra docs said.
4. **Graduate to `src/harness/`** with tests once the pattern is clear. Mark `[x]`.
5. **Optionally write a short LLD** under `docs/lld/` if the integration deserves it.
