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

#### `[ ]` 1. Broaden HyperFrames catalog — more blocks, skills, tools
- **What**: Expand the skill bundle at `src/harness/skills/hyperframes/` with additional block primitives (CTA buttons, multi-line lower-thirds, kinetic-type frames, lower-thirds-with-logo, split-screen, end-card). Expose them via new typed tools when needed.
- **Why interesting**: Most of the agent's intelligence is encoded in the *catalog*. The richer the catalog, the less the LLM has to invent from scratch — fewer hallucinated CSS, fewer broken clips.
- **Mastra primitives**: `Skill` markdown frontmatter + tool schemas + composition tools (`add-clip`, `update-clip`).
- **Effort**: Low-medium. Mostly content + a few new tools.
- **Spike**: catalog one new block per session in the journal.

#### `[ ]` 2. Cost-optimised generation — programmatic blocks + LLM-styled copy
- **What**: Instead of asking the LLM to produce raw HTML, have it emit a **typed block reference** plus **style tokens** and **copy** (e.g. `{ block: "hero-title", copy: { headline: "Launch.", subtitle: "…" }, style: { palette: "warm-peach", motion: "fade-up" } }`). Our composer assembles the actual HTML server-side from a registered template + Tailwind classes.
- **Why interesting**: Massive token reduction — generation cost drops from ~800 tokens per clip to ~120. Plus deterministic output → fewer broken clips, free brand consistency, simpler validation.
- **Mastra primitives**: typed tool schemas (Zod) for block-references; composer mode runs *after* director and assembles templates.
- **Effort**: Medium. Needs (a) block-template registry, (b) tool schema rework, (c) prompt update so the director emits references not HTML.
- **Risk**: Quality regression if templates are too rigid. Mitigate with a "free-form HTML escape hatch" tool for unusual clips.
- **Spike**: build 2–3 templates, A/B them against the current free-form path, compare token cost + quality.

> **Verdict on M10 fit**: Item 1 is a clear M10 fit — it's additive, low-risk, advances the core value prop. **Item 2 should start as a research spike during M10 and ship in M11.** It's a meaningful rework of the composer's contract; doing it half-baked risks slipping M10. Treat M10 as the place we *prove* the spike, not where we ship the rewrite.

### Post-M10 (M11+)

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
