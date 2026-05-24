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

| Sub | Goal | Sessions |
|---|---|---|
| M10a | Block registry: wrap HyperFrames catalog into Zod-schema'd local blocks (`video-clip`, `text-overlay`, `image-clip`, `audio-track`, `caption`) | 1–2 |
| M10b | Editor 4-pane shell (resizable: AssetLib · Preview · Timeline · Properties + Chat drawer) | 1 |
| M10c | **Timeline lib spike & decision** → ADR-005 (`@xzdarcy/react-timeline-editor` vs custom dnd-kit) → implement | 2 |
| M10d | Properties panel (schema-driven from block registry) | 1 |
| M10e | Asset library + drag-from-library → timeline (still in-memory blob URLs) | 1 |
| M10f | Full tool catalog: context (`get-project`, `get-composition`, `search-blocks`, `get-block-schemas`), mutation (`add-clip`, `update-clip`, `remove-clip`, `reorder`, `set-meta`), validation (`validate-composition`) | 2–3 |
| M10g | Skills authored: `hyperframes/SKILL.md`, `composition/SKILL.md`, `captions/SKILL.md` (wrap HeyGen's `hyperframes` skill content) — `lld-07-skills.md` | 1 |
| M10h | Kibo UI chat: `<Reasoning>`, `<Message>`, `<ToolCall>` (calling/executing/result), `<CompositionDelta>` indicator | 1 |

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
- **Subagents** (forked)
- **Plan / Build modes** (only `vibe` for MVP)
- **Multiplayer / collab**
- **HeyGen avatar block**
- **MCP server**
- **`hyperframes-media`** (TTS / transcription) integration
- **Remotion → HyperFrames import**
- **Multi-pod Harness state** (Redis-backed store)

Each gets its own ADR + LLD when picked up.

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
