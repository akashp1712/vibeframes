# 🎬 VibeFrames

> **A Mastra Harness agent that composes videos through conversation.** 
> You describe what you want. The agent reasons, calls tools, and builds a [HyperFrames](https://github.com/heygen-com/hyperframes) composition—clip by clip, track by track—while you watch in real time.

![VibeFrames Banner](./assets/vibeframes_banner.png)

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
  ┌──────────────┐    chat     ┌──────────────┐    tools    ┌──────────────┐
  │              │   ──────►   │              │   ──────►   │              │
  │     You      │             │    Mastra    │             │  HyperFrames │
  │   describe   │             │   Harness    │             │   (render)   │
  │   a video    │   ◄──────   │   agent      │   ◄──────   │              │
  │              │    SSE      │              │   compose   │              │
  └──────────────┘   events    └──────────────┘    tree     └──────────────┘
```

1. **You describe your idea:** *"Add a sleek neon title slide with a purple-to-blue gradient and type write 'Welcome to the Future'."*
2. **Mastra Harness reasons:** The agent maps the request to the appropriate mode (`plan` or `vibe`) and determines the required action.
3. **Tools mutate the tree:** Fine-grained, typed tool calls modify a canonical composition tree (fully validated via Zod schemas).
4. **HyperFrames renders in real-time:** The tree is immediately pushed to a `<hyperframes-player>` web component inside the browser.
5. **SSE streaming:** Reasoning tokens, tool logs, and state updates stream back to the frontend in real time, keeping the user in the loop.

---

## 🛠️ The Tech Stack

| Layer | Technology | Why It Fits |
| :--- | :--- | :--- |
| **Agent Runtime** | [Mastra](https://mastra.ai) Harness | Multi-mode reasoning, unified state, typed toolkits, and an integrated event bus out of the box. |
| **Video Engine** | [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML-native, deterministic, and highly structural—ideal for AI-driven generation. |
| **Model** | OpenAI `o4-mini` via [AI SDK](https://sdk.vercel.ai) | Blazing fast reasoning and excellent structure-following at low cost. |
| **Framework** | Next.js 16 (App Router), React 19 | Server-Sent Events (SSE) route handlers, Server Components, and smooth reactivity. |
| **Testing** | Vitest + React Testing Library | TDD workflow — tests are the spec, written before implementation. |
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
  ✅  M8: Core Scaffold, Studio UI & TDD Foundation    👈 [Just shipped]
  ⏳  M9: Harness Loop End-to-End Integration
  ⬜  M10: Full Interactive Studio + Canvas + Tool Suite
  ⬜  M11: Persistence, Project Management & Auth
  ⬜  M12: Performance Polish, Micro-animations & Dev Deploy
  ⬜  M13: Production Launch
```

---

## 📖 Deep Dive Into the Architecture

Before writing a single line of application code, we designed every layer. The repository contains extensive architectural documentation:

*   **[`docs/README.md`](./docs/README.md):** The starting guide to all technical docs.
*   **[HyperFrames Exploration](./docs/01-hyperframes-exploration.md):** Understanding the video block structure.
*   **[Mastra Primer](./docs/02-mastra-primer.md):** The bottom-up agentic building blocks.
*   **[Harness deep-dive](./docs/03-harness-why-what-how.md):** State management patterns and event pipelines.
*   **[Our Harness design](./docs/04-our-harness-vhld.md):** The dual-mode (plan + vibe) state machine.
*   **[HLD — tools & flows](./docs/05-hld-tools-flows.md):** Server-Sent Events protocol and composition pipeline.
*   **[Tech stack](./docs/06-tech-stack.md):** Decisive structural choices and future upgrade plans.
*   **[UI exploration](./docs/07-ui-system.md):** Typography, color-palettes, and canvas styling.

*   **Architecture Decision Records (ADRs):**
    *   [ADR-001: SSE Chat Transport](./docs/decisions/ADR-001-sse-chat-transport.md)
    *   [ADR-002: LLM Provider Reasoning](./docs/decisions/ADR-002-llm-provider-reasoning.md)
    *   [ADR-003: Storage Strategy](./docs/decisions/ADR-003-storage-strategy.md)

---

## 📐 Core Architecture & Harness Agent Diagrams

Here are the high-level design (HLD) diagrams and runtime structures illustrating how **VibeFrames** uses Mastra Harness, processes prompts, mutates states, and streams events back to your interface.

### 1. Mastra Construct Stack & Harness Anatomy

This diagram explains how Mastra's building blocks connect together under the hood—from the long-lived Project Harness container at the top down to the OpenAI `o4-mini` model at the bottom:

```text
  HOW MASTRA CONSTRUCTS CONNECT
  ═════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │                         ╔═══════════════╗                           │
  │                         ║   HARNESS     ║  ← long-lived container   │
  │                         ║               ║    per project            │
  │                         ╚═══════╤═══════╝                           │
  │                                 │                                   │
  │                   ┌─────────────┼─────────────┐                     │
  │                   │             │             │                     │
  │                   ▼             ▼             ▼                     │
  │            ╔════════════╗ ╔══════════╗ ╔════════════╗               │
  │            ║   MODES    ║ ║  STATE   ║ ║  MEMORY    ║               │
  │            ║            ║ ║  (Zod)   ║ ║  + STORAGE ║               │
  │            ╚═════╤══════╝ ╚══════════╝ ╚════════════╝               │
  │                  │                                                  │
  │         ┌────────┴────────┐                                         │
  │         │                 │                                         │
  │         ▼                 ▼                                         │
  │  ╔════════════╗    ╔════════════╗                                   │
  │  ║ MODE:plan  ║    ║ MODE:vibe  ║   ← swap agent behavior          │
  │  ║            ║    ║            ║     without rebuilding             │
  │  ╚═════╤══════╝    ╚═════╤══════╝                                   │
  │        │                 │                                          │
  │        ▼                 ▼                                          │
  │  ╔════════════╗    ╔════════════╗                                   │
  │  ║   AGENT    ║    ║   AGENT    ║   ← wraps model + instructions    │
  │  ║  Planner   ║    ║  Composer  ║     + tools                       │
  │  ╚═════╤══════╝    ╚═════╤══════╝                                   │
  │        │                 │                                          │
  │        │     ┌───────────┤                                          │
  │        │     │           │                                          │
  │        ▼     ▼           ▼                                          │
  │  ╔══════════╗     ╔════════════╗                                    │
  │  ║  TOOLS   ║     ║   SKILLS   ║   ← tools = actions               │
  │  ║ (Zod in/ ║     ║  (loaded   ║     skills = knowledge             │
  │  ║  out)    ║     ║   on       ║                                    │
  │  ╚════╤═════╝     ║   demand)  ║                                    │
  │       │           ╚════════════╝                                    │
  │       ▼                                                             │
  │  ╔══════════════════════╗                                           │
  │  ║    AI SDK CORE       ║   ← unified LLM interface                 │
  │  ║  generateText()      ║     (provider-agnostic)                   │
  │  ║  streamText()        ║                                           │
  │  ╚══════════╤═══════════╝                                           │
  │             │                                                       │
  │             ▼                                                       │
  │  ╔══════════════════════╗                                           │
  │  ║    LLM PROVIDER      ║   ← OpenAI o4-mini                       │
  │  ║  @ai-sdk/openai      ║     (swappable to any provider)           │
  │  ╚══════════════════════╝                                           │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

The concrete runtime anatomy of a single project's **VibeFrames Harness** instance is structured as follows:

```text
┌──────────────────────────────────────────────────────────────────┐
│               VibeFrames Harness (per project)                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │      STATE       │  │     STORAGE      │  │     MEMORY     │  │
│  │                  │  │                  │  │                │  │
│  │  projectId       │  │  LibSQLStore     │  │  lastMessages  │  │
│  │  composition     │  │  (file:local.db) │  │  : 20          │  │
│  │  selection       │  │                  │  │                │  │
│  │  projectMeta     │  │  threads         │  │  OM: deferred  │  │
│  │  renderStatus    │  │  messages        │  │                │  │
│  │  yolo: true      │  │  state snapshots │  │  semantic:     │  │
│  └──────────────────┘  └──────────────────┘  │  deferred      │  │
│                                              └────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────┐┌───────────────────────────┐ │
│  │   MODE: "plan" (default)        ││   MODE: "vibe"             │ │
│  │                                 ││                           │ │
│  │   Agent: Planner                ││   Agent: Composer          │ │
│  │   Model: o4-mini (low effort)   ││   Model: o4-mini (medium)  │ │
│  │   instructions: buildPlan-      ││   instructions: buildVibe- │ │
│  │     nerPrompt(state)            ││     Prompt(state)          │ │
│  │   tools: contextTools ONLY      ││   tools: ALL tools         │ │
│  │                                 ││                           │ │
│  │   PURPOSE: think, propose plan  ││   PURPOSE: execute plan    │ │
│  │   OUTPUT: structured plan card  ││   OUTPUT: composition      │ │
│  │     (user approves → vibe)      ││     mutations + response   │ │
│  └─────────────────────────────────┘└───────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐ │
│  │       WORKSPACE          │  │          EVENT BUS             │ │
│  │                          │  │                                │ │
│  │   skills/                │  │  agent.thinking                │ │
│  │   ├── hyperframes/       │  │  agent.responding              │ │
│  │   ├── composition/       │  │  tool.calling                  │ │
│  │   ├── captions/          │  │  tool.result                   │ │
│  │   └── audio/             │  │  composition.delta             │ │
│  │                          │  │  run.complete                  │ │
│  │                          │  │  run.error                    │ │
│  └──────────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2. End-to-End Core Request Flow

This diagram traces one user message turn through the server routes, into the Harness's active Mode, through LLM reasoning, state updates via mutation tools, and finally back to the browser:

```text
  ┌──────────────────────────────────────────────────────────────────────┐
  │  USER                                                                │
  │  "make the title clip 2 seconds longer"                              │
  │  [selection: { clipId: "title-1", intent: "edit" }]                  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │  POST /api/chat
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ROUTE HANDLER                                                       │
  │                                                                      │
  │  1. getOrCreateHarness("proj-1")        ← cache hit                  │
  │  2. harness.setState({ selection })     ← inject selection           │
  │  3. harness.subscribe(events → SSE)     ← wire event stream          │
  │  4. harness.sendMessage({ content })    ← start agent turn           │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  HARNESS → MODE → AGENT                                             │
  │                                                                      │
  │  instructions(state):                                                │
  │    "You are Composer. Project: proj-1.                               │
  │     Composition: 3 clips, 15s.                                       │
  │     Selection: title-1 (intent: edit).                               │
  │     Use tools to modify."                                            │
  │                                                                      │
  │  ┌─ LLM Reasoning ──────────────────────────────────────────────┐   │
  │  │  User wants title clip longer by 2s.                         │   │
  │  │  Current: title-1 duration=4s. New: 6s.                      │   │
  │  │  Plan: get-composition → update-clip → validate.             │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                      │
  │  Tool calls:                                                         │
  │    ① get-composition({})            → reads state.composition        │
  │    ② update-clip({ clipId, dur })   → mutates tree, emits delta     │
  │    ③ validate-composition({})       → pure validation, no mutation   │
  │                                                                      │
  │  Final text: "Done — I extended the title clip to 6 seconds."        │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │  SSE events stream back
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  CLIENT                                                              │
  │                                                                      │
  │  Chat panel:     thinking → tool cards → response text               │
  │  Preview:        re-rendered on composition.delta                     │
  │  Timeline:       title-1 bar extended to 6s                          │
  │  Properties:     duration field updated to 6                         │
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

```bash
git clone https://github.com/akashp1712/vibeframes.git
cd vibeframes
pnpm install
cp .env.example .env.local   # add your OPENAI_API_KEY
pnpm dev                      # → http://localhost:3000
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
