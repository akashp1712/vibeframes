# 🎬 VibeFrames

> **A Mastra Harness agent that composes videos through conversation.**
> You describe what you want. The Director agent runs a four-phase pipeline — Brief → Storyboard → Compose → Validate — calling focused tools at each step, while you watch the composition build in real time inside the browser.

![VibeFrames Banner](./assets/vibeframes_banner.png)

### 📺 Live HTML-Native Promo Showcase

VibeFrames composes **HTML-native videos** that render inside the browser. Rather than a flat, static MP4, the promotional video showing our stack is fully interactive and seekable! You can preview the live compiled composition (with synchronized sliding whooshes, chime pops, and typewriting sound effects) directly inside the running app:

👉 **[Watch the Live HTML-Native Intro Showcase](http://localhost:3000/intro/index.html)** *(or serve `public/intro/index.html` locally)*

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![Engine: HyperFrames](https://img.shields.io/badge/Engine-HyperFrames-violet.svg)](https://github.com/heygen-com/hyperframes)
[![Agent: Mastra](https://img.shields.io/badge/Agent-Mastra%20Harness-cyan.svg)](https://mastra.ai)

</div>

---

## ✨ The Vision

Traditional video editing is tedious, slow, and click-heavy. **VibeFrames** reimagines the video creation process by introducing a collaborative AI partner. You don't drag-and-drop or fight with complex timelines—you simply **vibe and describe**. 

By pairing the reasoning capabilities of state-of-the-art LLMs with a robust, deterministic, HTML-native video player (**HyperFrames**), VibeFrames lets you edit videos via pure dialogue, streaming visual changes instantly to your screen.

---

## 🚀 How It Works

```
  ┌──────────┐  chat   ┌───────────────────────────────────────────┐  HTML   ┌──────────────┐
  │          │ ──────► │              Mastra Harness               │ ──────► │  HyperFrames │
  │   You    │         │                                           │         │   (render)   │
  │ describe │         │  BRIEF → STORYBOARD → COMPOSE → VALIDATE  │         │   in browser │
  │  a video │ ◄────── │              Director Agent               │         │              │
  │          │   SSE   │                                           │         │              │
  └──────────┘  events └───────────────────────────────────────────┘         └──────────────┘
```

1. **Brief** — Director reads your prompt and calls `commit-brief`, locking in intent, arc, format, duration, brand, and narration style.
2. **Storyboard** — Director calls `list-blocks` (to see available HyperFrames blocks), then `commit-storyboard`, producing 2–20 beats — each a cinematic shot spec.
3. **Compose** — Director calls `create-beat` once per beat. The translator picks the right block, fills in brand-aware vars, and emits clips into the composition tree.
4. **Validate** — Director calls `check-storyboard`. If issues are found it revises beats and rebuilds, then replies in 2 sentences.
5. **SSE streaming** — every phase emits events back to the browser: tool cards, thinking indicators, and the live `compositionHtml` payload that re-renders the preview iframe.

---

## 🛠️ The Tech Stack

| Layer | Technology | Why It Fits |
| :--- | :--- | :--- |
| **Agent Runtime** | [Mastra](https://mastra.ai) Harness | Single-agent Director with state-aware instructions, phase-guarded tools, and skills loaded into workspace. |
| **Video Engine** | [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML-native, deterministic, block-based — ideal for LLM-driven generation. |
| **Model** | OpenAI `gpt-4o-mini` via [AI SDK](https://sdk.vercel.ai) | Fast reasoning + structured tool calling. Override via `VIBEFRAMES_MODEL`. |
| **Framework** | Next.js 16 (App Router), React 19 | SSE route handlers, per-project `[projectId]` studio route, and smooth reactivity. |
| **Testing** | Vitest (unit + e2e) | TDD — tests are the spec. `pnpm test` runs unit tests; `pnpm test:e2e` runs the live LLM pipeline. |
| **UI Styling** | shadcn/ui (base-nova) + Tailwind v4 + MagicUI | Light-mode-first aesthetic with shimmer, border-beam, and shiny-text micro-animations. |

---

## 🗺️ Project Roadmap & Status

VibeFrames is structured around a rigorous design-first lifecycle. All core architecture decisions are documented in detail within the repository.

```
  DESIGN PHASE  ──────────────────────────────────────────
  ✅  M0: Origin & Idea (Scaffolding, Core Vision)
  ✅  M1: HyperFrames Exploration (CDN Player, Block Catalog)
  ✅  M2: Mastra Primer (LLM, Agents, Tools, Memory)
  ✅  M3: Harness Design (Lifecycle, State Stores, Event Bus)
  ✅  M4: VibeFrames Harness VHLD (State Schema, Twin-Mode Flow)
  ✅  M5: High-Level Design (SSE transport, Render Pipeline)
  ✅  M6: Tech Stack & Architecture Decision Records (ADRs)
  ✅  M7: UI/UX system design (Dark theme palettes, wireframes)

  BUILD PHASE  ───────────────────────────────────────────
  ✅  M8: Core Scaffold, Studio UI & TDD Foundation
  ✅  M9: Harness Loop End-to-End Integration
  ✅  M10: Single-Agent Director + 4-Phase Pipeline         👈 [Just shipped]
  🔄  M11: Studio Polish — captions, timeline, per-project routing
  ⬜  M12: Persistence, Project Management & Auth
  ⬜  M13: Performance Polish, Micro-animations & Deploy
  ⬜  M14: Production Launch
```

---

## 📖 Deep Dive Into the Architecture

The repository is built design-first. Every layer is documented before the code was written:

**Active reference (always current):**
*   **[`docs/harness-architecture.md`](./docs/harness-architecture.md):** Single source of truth — repo map, state schema, tool catalogue, how to add blocks/rules/skills, SSE event shape, and a local dev quick-reference.

**Design phase docs (historical context):**
*   **[`docs/README.md`](./docs/README.md):** Guide to all design docs.
*   **[HyperFrames Exploration](./docs/01-hyperframes-exploration.md):** Block catalog structure.
*   **[Mastra Primer](./docs/02-mastra-primer.md):** Agentic building blocks bottom-up.
*   **[Harness deep-dive](./docs/03-harness-why-what-how.md):** State management and event pipelines.
*   **[HLD — tools & flows](./docs/05-hld-tools-flows.md):** SSE protocol and composition pipeline.

**LLD series:**
*   **[LLD-08: Phased Director](./docs/lld/lld-08-phased-director.md):** Single-agent 4-phase design rationale.
*   **[LLD-09: Codebase Cleanup](./docs/lld/lld-09-codebase-cleanup.md):** Hierarchical harness reorg.
*   **[Analysis: HyperFrames vs VibeFrames](./docs/analysis/hyperframes-vs-vibeframes.md):** Integration boundary analysis.

*   **Architecture Decision Records (ADRs):**
    *   [ADR-001: SSE Chat Transport](./docs/decisions/ADR-001-sse-chat-transport.md)
    *   [ADR-002: LLM Provider Reasoning](./docs/decisions/ADR-002-llm-provider-reasoning.md)
    *   [ADR-003: Storage Strategy](./docs/decisions/ADR-003-storage-strategy.md)

---

## 📐 Core Architecture & Harness Agent Diagrams

Here are the high-level design diagrams illustrating how **VibeFrames** uses Mastra Harness, runs the four-phase pipeline, and streams events back to your browser.

### 1. Harness Anatomy — Single Director Agent

One agent, one mode, four phases in one conversation turn:

```text
  ┌─────────────────────────────────────────────────────────────────┐
  │               VibeFrames Harness  (per project)                 │
  │                                                                 │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  STATE  (VibeFramesState — Zod)                         │   │
  │  │  brief, storyboard, validationReport                    │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  STORAGE  LibSQL  (threads · messages · state)          │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  DIRECTOR  —  ONE Agent                                 │   │
  │  │                                                         │   │
  │  │   model:   gpt-4o-mini  (override via VIBEFRAMES_MODEL) │   │
  │  │   prompt:  state-aware — phase + state summary rebuilt  │   │
  │  │            on every LLM call                            │   │
  │  │   tools:   11 tools, all visible, phase-guarded inside  │   │
  │  │   skills:  workflow · brief · storyboard · design ·     │   │
  │  │            validate  (loaded once, cached in prompt)    │   │
  │  └──────────────────┬──────────────────────────────────────┘   │
  │                     │                                          │
  │         one user turn = full pipeline                           │
  │                     │                                          │
  │   ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌──────────┐        │
  │   │  BRIEF  │►│ STORYBOARD  │►│ COMPOSE │►│ VALIDATE │        │
  │   └─────────┘ └─────────────┘ └─────────┘ └──────────┘        │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
                  SSE stream → browser
```

### 2. Four-Phase Pipeline

```text
  ┌────────┐    ┌────────────┐    ┌─────────┐    ┌──────────┐
  │ BRIEF  ├───►│ STORYBOARD ├───►│ COMPOSE ├───►│ VALIDATE │
  └────────┘    └────────────┘    └─────────┘    └──────────┘
  intent        plan beats        emit clips     check rules
```

| Phase      | Reads                    | Writes                      | Key Tools                                         |
|------------|--------------------------|-----------------------------|---------------------------------------------------|
| Brief      | user prompt              | `state.brief`               | `commit-brief`                                    |
| Storyboard | `state.brief`            | `state.storyboard`          | `list-blocks`, `commit-storyboard`, `revise-beat` |
| Compose    | `state.storyboard`       | composition tree (LibSQL)   | `create-beat`, `rebuild-beat`, `finish-compose`   |
| Validate   | storyboard + composition | `state.validationReport`    | `check-storyboard`                                |

`add-clip`, `update-clip`, `remove-clip` live in `tools-internal/` — the agent **never** sees them. Only the translator calls them during `create-beat` / `rebuild-beat`.

### 3. Repo Map (src/harness/)

```text
  src/harness/
  ├── index.ts                  getVibeFramesHarness() factory + barrel
  ├── state.ts                  Zod: Brief, Beat, Storyboard, ValidationReport
  ├── config.ts                 model defaults, fps, resolution
  ├── storage.ts                LibSQL store factory
  ├── brand-registry.ts         canonical brand colors (Linear, Stripe …)
  │
  ├── director/                 the single agent
  │   ├── agent.ts              Mastra Agent + Mode wiring
  │   ├── prompt.ts             state-aware system prompt (phase-aware)
  │   ├── phase.ts              phase derivation (Brief/Storyboard/Compose/Validate)
  │   ├── tools.ts              tool registry (re-exports from tools/)
  │   └── skills/               markdown guides loaded into workspace
  │       ├── workflow/skill.md     ← meta-skill: read FIRST every turn
  │       ├── brief/skill.md        how to fill a Brief
  │       ├── storyboard/skill.md   concept-first beat planning
  │       ├── design/skill.md       block variety, palette, overlays
  │       └── validate/skill.md     how to interpret the report
  │
  ├── composition/              the artifact we build
  │   ├── schema.ts             Clip / Track / Composition (Zod)
  │   ├── mutations.ts          pure ops (addClip, removeClip …)
  │   ├── store.ts              disk-backed per-project store
  │   ├── serialize.ts          JSON tree → HyperFrames HTML
  │   ├── translator.ts         beat → clip mutations (heart of Compose)
  │   └── validation-rules.ts   pure rule fns (beat-not-built, etc.)
  │
  ├── tools/                    what the agent can call
  │   ├── commit-brief.ts       writes state.brief
  │   ├── storyboard-tools.ts   propose/commit/revise storyboard
  │   ├── compose-tools.ts      create/rebuild/revise beat, finish-compose
  │   ├── check-storyboard.ts   runs validation rules → report
  │   ├── get-composition.ts    read-only inspection
  │   └── list-blocks.ts        slim catalog (id + description, no HTML)
  │
  ├── tools-internal/           low-level mutation primitives
  │   ├── add-clip.ts           NOT exposed to the agent
  │   ├── update-clip.ts        called only by the translator
  │   └── remove-clip.ts
  │
  ├── react/                    client hooks
  │   ├── use-composition.ts    derive ClipInfo[] + html from messages
  │   └── use-harness-chat.ts   POST /api/chat, parse SSE stream
  │
  └── __e2e__/
      └── pipeline.live.test.ts opt-in live LLM e2e (pnpm test:e2e)
```

---

### 4. End-to-End Request Flow

One user prompt → full pipeline → compositionHtml → preview re-render:

```text
  ┌──────────────────────────────────────────────────────────────────────┐
  │  USER                                                                │
  │  "Make a 15-second product demo for Linear, dark minimal vibe"       │
  └────────────┬─────────────────────────────────────────────────────────┘
               │  POST /api/chat  { messages, data: { projectId } }
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ROUTE HANDLER  (app/api/chat/route.ts)                              │
  │                                                                      │
  │  1. getVibeFramesHarness(projectId)     ← cache hit or create        │
  │  2. harness.subscribe(event → SSE)      ← wire event stream          │
  │  3. harness.sendMessage({ content })    ← fire the Director          │
  └────────────┬─────────────────────────────────────────────────────────┘
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  DIRECTOR AGENT  (one turn = full pipeline)                          │
  │                                                                      │
  │  Phase 1 — BRIEF                                                     │
  │    commit-brief({ message, arc, format, durationMs, brand … })       │
  │    → state.brief is locked                                           │
  │                                                                      │
  │  Phase 2 — STORYBOARD                                                │
  │    list-blocks()                    ← sees 21 block ids + descriptions│
  │    commit-storyboard({ beats[] })   ← state.storyboard = 5 beats    │
  │                                                                      │
  │  Phase 3 — COMPOSE  (per beat)                                       │
  │    create-beat({ index: 0 })        ← translator picks hero-title    │
  │    create-beat({ index: 1 })        ← translator picks stats-callout │
  │    …                                                                 │
  │    finish-compose()                 ← gate check, returns html       │
  │                                                                      │
  │  Phase 4 — VALIDATE                                                  │
  │    check-storyboard()               ← runs validation rules          │
  │    → reply: "Here's your 15s Linear demo — 5 beats, dark minimal."  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │  SSE events throughout
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  CLIENT (React)                                                      │
  │                                                                      │
  │  Chat panel:   tool cards per tool call + final reply text           │
  │  Preview:      compositionHtml from tool_end → iframe re-renders     │
  │  Timeline:     clip bars appear beat by beat                         │
  └──────────────────────────────────────────────────────────────────────┘
```

---

### 3. Server-Sent Events (SSE) Client-Server Communication Protocol

To ensure seamless, interactive updates without full page reloads or polling, VibeFrames implements a one-way event stream using Server-Sent Events (SSE):

```text
    ┌──────────┐                              ┌──────────────┐
    │  Client  │                              │    Server     │
    │  (React) │                              │  (Next.js)   │
    └────┬─────┘                              └──────┬───────┘
         │                                           │
         │  POST /api/chat                           │
         │  { projectId, prompt, threadId,           │
         │    selection? }                           │
         │ ─────────────────────────────────────────►│
         │                                           │
         │                              getOrCreateHarness(projectId)
         │                              harness.setState({ selection })
         │                              harness.subscribe(event => write)
         │                              harness.sendMessage({ content })
         │                                           │
         │  HTTP 200  Content-Type: text/event-stream│
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: agent.thinking                    │
         │  data: { }                                │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: tool.calling                      │
         │  data: { toolName, args }                 │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: composition.delta                 │
         │  data: { op, path, value }                │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: agent.responding                  │
         │  data: { text: "Done — I added..." }      │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: run.complete                      │
         │  data: { message, usage }                 │
         │◄──────────────────────────────────────────│
         │                                           │
     ┌───┴──────┐                              ┌─────┴──────┐
     │  Client  │                              │    Server  │
     └──────────┘                              └────────────┘
```

---

## ⚡ Quick Start

**The only required env var is `OPENAI_API_KEY`.** Everything else — model,
storage, data directory — has a working default.

```bash
git clone https://github.com/akashp1712/vibeframes.git
cd vibeframes
pnpm install
cp .env.example .env.local   # add your OPENAI_API_KEY
pnpm dev                      # → http://localhost:3000
```

On first prompt VibeFrames creates `./.data/vibeframes.db` (LibSQL file) for
threads/messages and writes per-project composition snapshots to
`./.data/compositions/*.json`. Refresh the page — your timeline is still
there. Both paths are gitignored.

### Swap storage for serverless

File-backed LibSQL won't survive Vercel's ephemeral filesystem. Point to
[Turso](https://turso.tech) in `.env.local`:

```bash
VIBEFRAMES_DB_URL=libsql://your-db-name.turso.io
VIBEFRAMES_DB_AUTH_TOKEN=...
```

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for full local development guidelines.

### Run tests

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
pnpm typecheck     # type-check without emit
```

### Explore the architecture

Open [`docs/README.md`](./docs/README.md) for the full design system and specs.

---

## 🛡️ License

Distributed under the [MIT License](./LICENSE).
