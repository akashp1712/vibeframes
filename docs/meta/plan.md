# VibeFrames — Build Plan (v6, module-based)

A narrative, module-by-module build plan for **VibeFrames** — a Mastra-Harness chat studio on HeyGen HyperFrames — where each module tackles one problem thoughtfully, ships its doc + code + journal, and only then moves to the next.

> **v6 changes from v5**
> - Replaced "days" with **modules** — each module = one well-formed deliverable, sized 1–3 sessions of ~2hr
> - Order follows your 14-point sequence exactly
> - **Mastra primer comes BEFORE Harness** (AI SDK → LLM → Agent → Workflows → Harness)
> - **DB + Clerk deferred** until the core Harness loop works locally with LibSQL
> - Two "Hello World" milestones: app HelloWorld (M8) and Harness HelloWorld (M9) — both ship-able demos
> - **Deployment doc** as its own module (M13), not an afterthought
> - Going public after **M7** — full doc stack visible, zero code yet — strongest possible "docs-before-code" moment

---

## 1. Repo shape (Day 1)

```
vibeframes/                       ← created Module 0
├── docs/
│   ├── README.md                 doc index
│   ├── 00-origin-story.md
│   ├── 01-hyperframes-exploration.md
│   ├── 02-mastra-primer.md
│   ├── 03-harness-why-what-how.md
│   ├── 04-our-harness-vhld.md
│   ├── 05-hld-tools-flows.md
│   ├── 06-tech-stack.md
│   ├── 07-ui-system.md
│   ├── 99-deployment-considerations.md   (M13)
│   ├── 99-lessons-learned.md             (ongoing)
│   ├── decisions/                ADRs created as decisions arise
│   ├── lld/                      LLDs created per-component as needed
│   └── journal/                  one entry per session
├── experiments/                  spikes (timeline lib, hyperframes player)
├── assets/                       screenshots, refs, design files
└── (app scaffolds at repo root from M8 onward)
```

**No `package.json` until M8.** Modules 0–7 ship docs only.

---

## 2. Module map (the 14 points → 13 modules)

| Your point | Module | Title | Sessions | Doc(s) shipped |
|---|---|---|---|---|
| 1 | M0 | Origin & idea | 1 | `00-origin-story.md` |
| 2 | M1 | HyperFrames exploration + where agents help | 1 | `01-hyperframes-exploration.md` |
| 3 | M2 | Mastra primer (AI SDK → LLM → Agent → Workflows) | 1–2 | `02-mastra-primer.md` |
| 4 | M3 | Harness — why / what / how | 1 | `03-harness-why-what-how.md` |
| 5 | M4 | Our Harness — VHLD (skills, tools, memory mapped to our idea) | 1 | `04-our-harness-vhld.md` |
| 6 | M5 | HLD — tools, SSE (vs req/res, WS, polling), render, composition, UI bridging | 2 | `05-hld-tools-flows.md` + ADR-001 (SSE) |
| 7 | M6 | Tech stack base (Next.js, Mastra, Vercel, Neon, Prisma, Clerk) | 1 | `06-tech-stack.md` + ADR-002 (LLM), ADR-003 (storage) |
| 8 | M7 | UI system & finalization (branding, components, wireframes) | 1–2 | `07-ui-system.md` + ADR-004 (UI stack) |
| — | **GO PUBLIC + LinkedIn post #1** | — | — | "I wrote 8 docs before a single line of code" |
| 9 | M8 | Scaffold + HelloWorld + per-component LLDs | 2–3 | scaffold + `lld-01-app-structure.md`, `lld-02-composition-model.md` |
| 10 | M9 | Harness HelloWorld end-to-end with LibSQL | 2–3 | working agent loop + `lld-03-harness-wiring.md`, `lld-04-sse-protocol.md` |
| 11 | M10 | The real thing — full editor + tools + chat UI | 8–12 | spans 8 sub-modules, multiple LLDs |
| 12 | M11 | Add persistence: Prisma + Neon + Clerk + multi-tenancy | 2–3 | migration + `lld-05-auth-multitenancy.md`, `lld-06-storage-migration.md` |
| 13 | M12 | Polish + deploy | 2 | Vercel deploy + final README |
| 13 | M13 | Deployment considerations doc | 1 | `99-deployment-considerations.md` + launch post |
| 14 | — | (LLDs are sprinkled throughout — one problem at a time) | — | — |

**Total**: ~28–35 sessions · ~2hr each · 5/week ≈ 6–7 weeks.

---

## 3. Module details

### M0 — Origin & idea  *(1 session, PRIVATE)*
**Goal**: capture the spark in writing.
- Create `vibeframes/` folder, `docs/` skeleton, `git init` (private repo)
- Write `docs/00-origin-story.md`: the HeyGen tweet, what hooked you, the "what if Mastra Harness + HyperFrames" jump
- Write `docs/README.md` (doc index)
- `docs/journal/session-01.md`

### M1 — HyperFrames exploration  *(1 session)*
**Goal**: understand what HyperFrames is and where an agent multiplies it.
- Install `@hyperframes/player` in `experiments/hyperframes-hello/`
- Render a static composition (HTML w/ `data-start`, `data-duration`, `data-track-index`) — verify hot reload
- Write `docs/01-hyperframes-exploration.md`:
  - What HyperFrames is (HTML-native, agent-first, deterministic render)
  - Package inventory: `player`, `core`, `engine`, `producer`, `studio`, `shader-transitions`, CLI
  - Block catalog (50+ via `npx hyperframes add`)
  - Their existing agent skills (`hyperframes`, `hyperframes-media`, adapters)
  - **Where does an agent help?** — composition authoring, edits, captioning, asset choice, validation
  - Diagram: VibeFrames sits between user-chat and HyperFrames-render
- Journal

### M2 — Mastra primer  *(1–2 sessions)*
**Goal**: build mental model bottom-up: SDK → LLM → Agent → Workflows.
- Write `docs/02-mastra-primer.md` with a tiny code snippet per concept:
  1. **AI SDK** — `streamText({ model, messages })` — what it does, why
  2. **LLM + reasoning** — `openai('o4-mini', { reasoningEffort, reasoningSummary })` — explicit reasoning params
  3. **Agent** — wraps model + instructions + tools (vs raw `streamText`)
  4. **Tool** — Zod-typed input/output, `execute()` function
  5. **Workflow** — orchestrating multi-step deterministic flows (briefly — we won't use these in MVP)
  6. **Memory** — short-term thread vs observational memory (preview only)
- Each concept: 5 lines of code + 3 lines of "why this matters"
- Journal

### M3 — Harness: why, what, how  *(1 session)*
**Goal**: the conceptual deep-dive.
- Write `docs/03-harness-why-what-how.md`:
  - **Why** — multi-turn conversational state, modes, memory, workspace, side-channels (problems plain Agent doesn't solve)
  - **What** — Harness bundles: state (Zod) + storage + memory + modes + workspace + tools + subagents + events
  - **How** — lifecycle (init → setState → sendMessage → events) + dynamic `instructions(state)` + `subscribe()`
  - Reference: mc-studio `HARNESS-OVERVIEW.md` + Mastra docs
  - Diagram: anatomy of a Harness (the box-in-box from mc-studio)
- Journal

### M4 — Our Harness — VHLD  *(1 session)*
**Goal**: map Harness shape to VibeFrames.
- Write `docs/04-our-harness-vhld.md`:
  - One big diagram of VibeFrames Harness with:
    - State shape (projectId, currentJsonTree, selection, …)
    - Single `vibe` mode → Composer agent
    - Skills list (`hyperframes`, `composition`, `captions`, `audio`)
    - Tools list (context / mutation / validation — by category, not names yet)
    - Memory strategy (LibSQL thread, OM deferred)
    - Events emitted
  - 5 bullets per box. No code yet. This is the *shape*.
- Journal

### M5 — HLD: tools, SSE, render, composition, UI bridging  *(2 sessions)*
**Goal**: the parent HLD that all subsystems flow from.
- Write `docs/05-hld-tools-flows.md` — sectioned, scannable:
  1. **Chat transport**: why SSE? Compare polling, request/response, WebSockets, RSC streaming. Decision matrix + ADR-001
  2. **SSE event protocol**: `run.start`, `agent.thinking`, `agent.responding`, `tool.calling/executing/result`, `composition.delta`, `composition.validate`, `run.complete/error` — each with payload sketch
  3. **Composition pipeline**: jsonTree (canonical) → serialize → HTML → `<hyperframes-player>`. Mutations as pure functions emitting deltas.
  4. **Render pipeline**: browser preview (player) vs MP4 (`hyperframes render` CLI, post-launch via Inngest)
  5. **UI bridging**: what the chat panel subscribes to, optimistic delta application, tool-call cards, reasoning collapse
- **ADR-001 — SSE chat transport** (decision recorded)
- Journal × 2

### M6 — Tech stack base  *(1 session)*
**Goal**: anchor the toolchain.
- Write `docs/06-tech-stack.md` — one paragraph each:
  - **Next.js 15** (App Router, RSC, route handlers, server actions)
  - **Mastra** (already covered M2/M3)
  - **`@ai-sdk/openai`** + model picks (`o4-mini` default, env-swap to `gpt-5.1`) → **ADR-002**
  - **Vercel** (deploy)
  - **Neon Postgres + Prisma** (app data; deferred until M11)
  - **LibSQL** (Mastra storage default; flag-swap to PgStore later) → **ADR-003**
  - **Clerk** (auth + orgs; deferred until M11)
  - **Vercel Blob** (asset bytes)
- Each: why · alternative · what we're learning
- Journal

### M7 — UI system & finalization  *(1–2 sessions)*
**Goal**: branding + component picks locked.
- Write `docs/07-ui-system.md`:
  - **Branding**: light · editorial · soft pastels (Linear/Notion DNA)
  - **Palette**: warm off-white BG, muted indigo action, rotating pastel accents (mint / blush / lavender / butter)
  - **Type**: `Inter` body + `Instrument Serif` headings
  - **Motion**: 200–300ms ease-out, subtle
  - **Component picks by surface** (with reference screenshots in `assets/inspiration/`):
    - Landing — MagicUI `AnimatedGradientText`, `Marquee`, one Aceternity `Spotlight`
    - Shell — tweakcn / shadcn-blocks sidebar + topbar
    - Chat panel — Kibo UI `Message`, `Reasoning`, `ToolCall`, `Suggestion`
    - Forms — shadcn primitives
  - **ASCII wireframes**: Landing, Project list, Editor (4-pane), Chat panel, Empty states
- **ADR-004 — UI component stack**
- Journal

---

### 🚀 GO PUBLIC after M7

Flip repo to public · push all 8 docs + 4 ADRs · **LinkedIn post #1**:
> "I wrote 8 docs explaining what I'm building before a single line of code. Origin → HyperFrames exploration → Mastra primer → Harness deep-dive → VHLD → HLD → tech stack → UI system. Now the building begins."

---

### M8 — Scaffold + HelloWorld + per-component LLDs  *(2–3 sessions)*
**Goal**: app scaffold + working HyperFrames preview + LLDs for the core pure modules.
- `pnpm create next-app .` at repo root (TS, App Router, Tailwind v4, no `src/`)
- shadcn init, install Kibo/MagicUI/Aceternity, theme from `07-ui-system.md`
- `/sandbox` page renders a static HyperFrames composition via `<hyperframes-player>`
- Hand-write composition mutation utilities (pure, unit-tested)
- Write:
  - `docs/lld/lld-01-app-structure.md` (folder conventions, import rules)
  - `docs/lld/lld-02-composition-model.md` (types, serialize, mutations, Vitest cases)
- Journal × 2–3

### M9 — Harness HelloWorld end-to-end (LibSQL)  *(2–3 sessions)*
**Goal**: prove the agent loop top-to-bottom with no auth/persistence complexity.
- Mastra installed + `@mastra/libsql`
- Single Harness instance (in-memory cache by projectId — no DB lookups yet)
- One vibe mode, Composer agent w/ explicit reasoning params + system prompt
- 2 placeholder tools: `echo`, `add-clip-stub` (mutates an in-memory composition)
- SSE route `/api/chat` emitting all events from ADR-001
- Tiny chat UI (no Kibo polish yet) showing reasoning collapse + responding stream + tool-call card
- Demo: type "add a title", agent calls `add-clip-stub`, UI shows the delta, refresh persists (LibSQL file db)
- Write:
  - `docs/lld/lld-03-harness-wiring.md` (state schema, lifecycle, mode, services)
  - `docs/lld/lld-04-sse-protocol.md` (full event spec, handlers, reconnection)
- **LinkedIn post #2** when this demo is solid: "Smallest possible Mastra Harness loop, end-to-end"
- Journal × 2–3

### M10 — The real thing  *(8–12 sessions — biggest module)*
Break into ordered sub-modules. Each ships its own LLD if non-trivial.

| Sub | Goal | Sessions | Status |
|---|---|---|---|
| M10a | Block registry: 20 Zod-schema'd HyperFrames blocks in `services/clip-registry.service.ts` (background-fill, hero-title, kinetic-words, split-screen, stats-callout, quote-pull, cta-button, end-card, lower-third, social/follow/effect overlays) | 1–2 | ✅ shipped |
| M10b | Editor 3-pane shell (Chat · Preview · Code) — 4-pane (Properties) deferred | 1 | ✅ shipped |
| M10c | Timeline visualization in Preview panel (GSAP-driven iframe) — ADR-005 deferred | 2 | ✅ shipped (basic) |
| M10d | Properties panel | 1 | ⏸ deferred to M-future |
| M10e | Asset library | 1 | ⏸ deferred to M-future |
| M10f | Tool catalog: brief/storyboard/compose/validate phase tools (`commit-brief`, `commit-storyboard`, `create-beat`, `rebuild-beat`, `revise-beat`, `finish-compose`, `check-storyboard`, `list-blocks`, `get-composition`); low-level mutations (`add-clip`/`update-clip`/`remove-clip`) hidden in `tools-internal/` and called only by translator | 2–3 | ✅ shipped |
| M10g | Skills authored: `workflow/SKILL.md`, `brief/SKILL.md`, `storyboard/SKILL.md`, `design/SKILL.md`, `validate/SKILL.md` in `director/skills/` — see `docs/harness-architecture.md` | 1 | ✅ shipped |
| M10h | Studio chat with progressive rendering: tool entries surface live via SSE; preview updates per `create-beat` call | 1 | ✅ shipped |
| M10i | Pipeline architecture: explored subagents (LLD-08 v1), rolled back to single Director (LLD-08 v2) — workflow skill drives ordering, brand-registry sanitizes LLM hex output, brand-color accent on every bg clip | 2 | ✅ shipped |
| M10j | Cleanup: deleted dead `transitionRegistry`, `tools/index.ts` legacy barrel, `add-transition` tool. Wrote `docs/harness-architecture.md` as SSOT. | 1 | ✅ shipped |

What landed (recap):
- One-prompt → finished composition end-to-end on `gpt-4o-mini` in ~30-40s, ~64k tokens (subagents path was 1.5M tokens / 315 LLM calls — rolled back)
- Single Director mode (`src/harness/director/`) — no subagents, no mode switching
- 5-skill discipline pack in `director/skills/` (workflow / brief / storyboard / design / validate)
- 20-block catalog with brand-color injection on bg track (transitions registry deleted in cleanup)
- 8 deterministic validation rules
- Brand registry fallback (Linear, Stripe, Vercel, ~20 known brands) with strict `safeHexColor` allowlist
- Live e2e LLM test (`pnpm test:e2e`) gated on `OPENAI_API_KEY`
- Single source of truth doc at `docs/harness-architecture.md`
- Deep-dive vs HyperFrames packs: `docs/analysis/hyperframes-vs-vibeframes.md` (drives MVP 1.0 → 5.0 roadmap below)

- **LinkedIn post #3** mid-M10: composition model post
- **LinkedIn post #4** end of M10: full demo (chat → timeline updates → preview live)
- Journals throughout

### M11 — Persistence: Prisma + Neon + Clerk + multi-tenancy  *(2–3 sessions)*
**Goal**: layer real persistence on top of working core.
- Prisma init + Neon DB
- Schema: `User`, `Workspace`, `Membership`, `Project`, `Composition`, `Asset`
- First migration; migrate in-memory project store → Prisma
- Clerk install, organizations on
- `middleware.ts` gating `/app/**` + `/api/**`; `lib/tenant.ts`
- Mastra storage flag swap: `MASTRA_STORAGE=libsql|pg`; verify PgStore against Neon
- Write `docs/lld/lld-05-auth-multitenancy.md`, `docs/lld/lld-06-storage-migration.md`
- **LinkedIn post #5**: "Built the agent loop first. Auth + DB layered on after."
- Journal × 2–3

### M12 — Polish + deploy  *(2 sessions)*
**Goal**: prod-ready.
- Empty / loading / error states everywhere
- One Aceternity spotlight on preview pane; one MagicUI accent on landing CTA — restrained
- Mobile block page (desktop-only product)
- Vercel deploy, env vars, Clerk prod, Neon prod branch
- Production smoke: full flow end-to-end
- Journal

### M13 — Deployment considerations + launch  *(1 session)*
**Goal**: capture the prod gotchas + ship.
- Write `docs/99-deployment-considerations.md`:
  - Vercel function timeouts (300s on Pro) — implications for long agent turns
  - SSE keep-alive, heartbeat, reconnection on Vercel
  - Cold starts and Harness cache invalidation (single-pod assumption)
  - Env vars, Clerk prod vs dev instances, Neon branching strategy
  - Cost notes (OpenAI per-turn, Neon free tier, Vercel hobby vs pro)
- Write `docs/99-lessons-learned.md` (every gotcha hit along the way)
- Final `README.md` (screenshots + demo Loom + architecture diagram + "powered by HyperFrames + Mastra")
- **LinkedIn post #6 (launch)**: demo + repo + docs + lessons
- Journal

---

## 4. Out of scope (explicit park list)

- **MP4 render** via `hyperframes render` + Inngest workflow
- **Observational memory** (Mastra `Memory` w/ observer+reflector)
- **Subagents** — tried in M10 LLD-08 v1, rolled back to single Director
- **Plan / Build modes** (only `vibe` for MVP)
- **Multiplayer / collab**
- **HeyGen avatar block**
- **MCP server**
- **`hyperframes-media`** (TTS / transcription) integration
- **Remotion → HyperFrames import**
- **Multi-pod Harness state** (Redis-backed store)

Each gets its own ADR + LLD when picked up.

---

## 4.5 MVP roadmap — what's "good enough" at each tier

Working > broad. Each MVP should ship something demonstrable end-to-end.
Polish trumps coverage; if a feature is half-working, it doesn't ship.

### MVP 1.0 — "the prompt-to-clip MVP"  *(today, M10 done)*

**Acceptance:** user types a prompt → 30-second branded composition,
no manual edits, validation passes clean.

| Capability | Status |
|---|---|
| Single-agent Director walks brief → storyboard → compose → validate in one turn | ✅ |
| 20-block catalog with brand-aware variant rendering | ✅ |
| 5 markdown skills (workflow / brief / storyboard / design / validate) | ✅ |
| Brand registry (Linear, Stripe, Vercel, …) with strict `safeHexColor` allowlist | ✅ |
| Studio: 3-pane shell, progressive preview render via SSE | ✅ |
| Validation: 8 deterministic rules, retry on errors (≤2 attempts) | ✅ |
| `pnpm test:e2e` live LLM e2e test (gated on `OPENAI_API_KEY`) | ✅ |
| `docs/harness-architecture.md` SSOT | ✅ |

**Known gaps in 1.0** (not regressions, never had them):
- No transitions between beats (transitions registry was deleted in M10 cleanup; agent never planned them and translator never consulted it — see [`docs/analysis/hyperframes-vs-vibeframes.md`](../analysis/hyperframes-vs-vibeframes.md) §3 for the full gap matrix)
- No entrance choreography — block templates ship static markup; no GSAP boilerplate emitted
- No layout / contrast audits (no analog of `hyperframes inspect` or `validate --wcag`)
- No diagram / flowchart blocks (composed from divs only)
- No audio / VO / music · no captions
- Translator copy comes from brand.name + brief.message — no per-beat user-facing copy field, so all beats lean on brand identity for headlines

### MVP 1.0.1 — stabilization (next up, ~1 session)

**Goal:** close silent-failure surface so today's catalog stops shipping subpar output. Drives directly from the gap analysis at [`docs/analysis/hyperframes-vs-vibeframes.md`](../analysis/hyperframes-vs-vibeframes.md) §5.1.

| Item | Effort | Why |
|---|---|---|
| Surface `safeHexColor` rejection in validation report | S | Today the brand-accent line silently disappears when the LLM emits malformed hex. Agent and journal should see it. |
| `rule_varSubstitutionFallback` validation rule | S | Translator records when a var fell through to a placeholder ("Hello", "100", etc.); rule warns per occurrence so the user knows the copy isn't intentional. |
| Refactor 5 social overlays to use `anchor` var | M | `social-avatar` / `mention-card` / `hashtag-pill` / `comment-bubble` / `like-counter` hard-code position. Mirror `subtitle-anchor`'s anchor enum. |
| Broaden `stats-callout` keyword routing | S | Today's regex `/\d+%\|\d+x\|metric\|callout\|stat/` misses "double", "triple", "K downloads", "ARR", "MAU". |
| Document 1-beat composition path in `design/skill.md` | XS | `pickPrimaryBlock` returns hero-title for first-and-last beat — clarify. |

**Acceptance:** prompt → composition → validation report shows zero silent placeholder fallbacks for non-trivial inputs; brand colors land on every composition or surface a clear warning; positioned overlays land where the storyboard intended.

### MVP 2.0 — "the explainer MVP"

**Acceptance:** 30s explainer composition has visible (and configurable) transitions between every beat; every text element animates in; no element bleeds into the next scene's frame; validation warns on contrast or layout issues.

Picks from `.agents/skills/website-to-hyperframes` and the `hyperframes` core skill — adopt the discipline patterns (per-beat HTML evidence, animation-map verification, beat-level VO scripting).

| New work | Effort | Notes |
|---|---|---|
| **Entrance choreography boilerplate** | M | Each block template gets a paired `<script type="module">` snippet that runs `tl.from(...)` on its named children. Translator stitches them. Stagger 0.08s, 3 eases per scene. (HF: `motion-principles.md` + `techniques.md`) |
| **CSS crossfade transitions v0** | M | Translator emits a `<style>` block per composition + GSAP scenes that fade `[data-clip-id]` ranges. Beat schema gets a `transitionToNext: { kind, durationMs } \| null` field. Ship 4 only: cut, fade, push, blur. NO shader transitions yet. |
| **Hard-kill at scene boundary** | S | Translator wraps each clip in opacity:0 + visibility:hidden after `data-duration` so cross-scene bleed is impossible. (HF: SKILL.md L327 + motion-principles) |
| **Per-beat copy fields** in `Beat` — `headline`, `subheading` (voCue already exists) | S | Decouples user-facing copy from internal `concept` prose. Translator stops slicing concept into headlines. |
| **3–5 diagram blocks** (flowchart-vertical, kanban, timeline-strip, terminal-typer, code-block) | M | "Feature reveal" workhorses for explainer videos. Compose from divs + Tailwind, no real graphics yet. |
| **Better selection heuristics** in `pickPrimaryBlock` — concept-keyword routing tuned per category | S | Stops the "extreme-close → stats-callout" overfit; addresses today's narrow regex. |
| **Layout overflow audit (lite)** | L (stretch) | Headless-Chrome seek per beat hero-frame, measure scrollWidth/scrollHeight per `data-clip-id` subtree, warn on overflow. (HF: `hyperframes inspect`) |
| **Contrast audit (lite)** | L (stretch) | Sample 5 timestamps, screenshot, sample background pixels behind text, compute WCAG AA, warn <4.5:1. (HF: `hyperframes validate`) |
| **Validation rules** — diagram-presence, voCue-coverage, transition-variety | S | Catches missing pieces. |
| **Storyboard skill update** — explainer arc patterns, diagram beat templates | XS | One section: "for explainer prompts, use this beat skeleton". |
| **Captions track** (LLD-07) | M | Per-word karaoke, simple GSAP impl. No transcription — VO scripts come from beat.voCue. (Could move to MVP 3.0 if we don't get to it.) |

### MVP 3.0 — "the social MVP"

**Acceptance:** vertical / portrait social ads with platform-correct
overlays and pacing.

| New work | Notes |
|---|---|
| **Vertical (1080×1920) layout pass** in translator | Rework block templates that assume 1920×1080. Composition `format` field already exists. |
| **Platform packs** (TikTok / Reels / Shorts / IG feed) — different overlay defaults, different timing rules | Skill addition: `platforms.md`. |
| **Hashtag / handle / engagement counter overlays** are real (already in catalog, just need platform-justified surfacing in design.md) | Tighten the design skill's "social-justified only" rule. |
| **Music track support** (uploaded mp3 → audio element) | LibSQL row reference; player plays the audio in iframe. No analysis, no audio-reactive yet. |
| **Storyboard rhythm: "fast" path well-tuned** (8-15 beats, hard cuts, sub-second beats) | Today the agent picks `fast` rhythm but hits the 2s minimum durationMs floor — need to adjust. |

### MVP 4.0 — "the cinematic MVP"

**Acceptance:** the system produces filmic / dramatic videos with
real visual texture (grain, light leak, rack-focus, parallax).

| New work | Notes |
|---|---|
| **Effect overlays** — grain, scanlines, vignette, light-leak | Already in catalog as units; activate via design skill rules. |
| **Shader transitions** (sdf-iris, whip-pan, ridged-burn, light-leak) — ports from `hyperframes/shader-transitions` | Real WebGL. Restored after MVP 2.0's transition foundation. |
| **HTML-in-canvas** for hero treatments — 3D iPhone / MacBook with HTML screen | Pulls from `vfx-iphone-device` block in HeyGen registry. Big lift; needs Three.js + WebGL. |
| **Audio-reactive** — bass→scale, mid→shape, treble→glow per the `hyperframes/audio-reactive` skill | Pre-extract audio bands at upload time; window.AUDIO_DATA pattern. |
| **Per-beat camera DSL** — beat.cameraMove already typed; translator emits the actual GSAP scale/translate tweens | Today cameraMove is metadata-only. Make it produce motion. |

### MVP 5.0 — "the brand kit MVP"

**Acceptance:** drop a `DESIGN.md` file at the start of a session,
all subsequent compositions match the brand's visual system.

| New work | Notes |
|---|---|
| **DESIGN.md import** — parse colors / fonts / voice → `brief.brand` | Schema fields (`brand.name`, `brand.primaryColor`, `brand.accentColor`, `brand.fontFamily`) already exist; just need a parser. |
| **Brand pack registry** — DEFAULT_BRAND extended with per-brand presets (palettes, gradients) | Today's `brand-registry.ts` only has primaryColor; extend to full palette. |
| **Translator brand-aware var rendering** — every text block can opt into brand font, brand color shadows, brand-tinted bg | Currently only the bg accent line uses brand color. |
| **Validation rule** — brand-consistency (every beat uses brand palette ≥ X%) | Replaces today's brand-color-presence (≥30% of clips). |

### Beyond MVP 5.0 — open questions

- MP4 render (Inngest workflow + headless Chrome)
- Multi-tenant Clerk + Postgres (M11 work)
- Caption transcription (whisper)
- Multi-pod harness state (Redis)
- HeyGen avatar block
- Subagents revisit (post-Mastra `prepareStep` shipping)

---

## 5. ADR inventory (created as decisions arise)

| ADR | Topic | When |
|---|---|---|
| 001 | SSE chat transport vs alternatives | M5 |
| 002 | LLM provider + reasoning | M6 |
| 003 | Storage strategy (LibSQL → PgStore) | M6 |
| 004 | UI component stack | M7 |
| 005 | Timeline editor library | M10c |
| 006 | Block registry format (YAML vs TS) | M10a |
| 007+ | (future) — render workflow, OM, subagents, multi-pod | post-launch |

## 6. LLD inventory (per-component, lazy)

| LLD | Subsystem | When |
|---|---|---|
| 01 | App structure & conventions | M8 |
| 02 | Composition model | M8 |
| 03 | Harness wiring | M9 |
| 04 | SSE protocol | M9 |
| 05 | Auth & multi-tenancy | M11 |
| 06 | Storage migration | M11 |
| 07 | Skills | M10g |
| 08+ | (extracted from M10 as needed) — tools, properties panel, asset library | M10 |

---

## 7. LinkedIn cadence (6 posts)

| # | After | Hook |
|---|---|---|
| 1 | M7 | "I wrote 8 docs before a single line of code" |
| 2 | M9 | "Smallest possible Mastra Harness loop, end-to-end" |
| 3 | mid-M10 | Composition model & JSON Patch deltas |
| 4 | end-M10 | Full demo — chat → timeline → preview |
| 5 | M11 | "Built the core first, layered auth & DB after" |
| 6 | M13 | Launch — demo + repo + docs + lessons |

---

## 8. Required setup (gather as needed)

| Item | Needed by |
|---|---|
| GitHub account | M0 |
| `OPENAI_API_KEY` | M2 (to verify reasoning works) |
| Node 22+, pnpm | M8 |
| FFmpeg | post-launch (render only) |
| Clerk account | M11 |
| Neon account | M11 |
| Vercel + Blob token | M11 / M12 |

---

## 9. M0 deliverables (so "approved" triggers something concrete)

When you reply **"approved, start M0"** I will:
1. Create `/Users/akashkumar.panchal/workspace/drafts/vibeframes/`
2. Create `docs/`, `docs/decisions/`, `docs/lld/`, `docs/journal/`, `experiments/`, `assets/`
3. `git init` (no remote yet — you'll create the private GitHub repo and I'll add the remote)
4. Write `docs/README.md` (doc index with status table — all docs marked TODO except 00)
5. Write `docs/00-origin-story.md` (first complete draft, ~1 page)
6. Write `docs/journal/session-01.md`
7. Write root `README.md` (points to `docs/README.md`)
8. Write `.gitignore`
9. Initial commit

**Zero `package.json`. Zero `npm`. Pure words.**

---

## 10. Ready?

Reply **"approved, start M0"** and I'll execute exactly the steps in §9.

Or send edits — I'll revise before switching modes.
