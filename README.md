# VibeFrames

> **A chat-first AI video studio.** Talk to an agent, watch the timeline build itself — clip by clip, track by track. Built on [Mastra Harness](https://mastra.ai) + [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes).

<!-- TODO: replace with 30-sec GIF at M9 -->

---

## What is this repo?

Three things at once:

### 🎓 A learning resource
Learn **Mastra Harness engineering** by reading the design docs that were written *before* the first line of code. Every architectural decision is documented, diagrammed, and explained from first principles.

### 📐 A reference implementation
The most thoroughly documented Mastra Harness project on GitHub. State schemas, tool design, SSE event protocols, storage strategy, mode architecture — all written as shareable specs with rich ASCII diagrams.

### 🎬 A working product
A web app where you describe a video in chat, and an AI agent composes it in real time using HyperFrames' HTML-native video engine. Plan mode thinks; Vibe mode builds.

---

## What you'll learn

If you read the docs in order, you'll understand:

1. **What HyperFrames is** — HTML-native video, agent-friendly by design ([doc 01](./docs/01-hyperframes-exploration.md))
2. **How Mastra works** — AI SDK → LLM → Agent → Tools → Memory, bottom-up ([doc 02](./docs/02-mastra-primer.md))
3. **What a Harness is and why it exists** — the problems it solves that a plain Agent can't ([doc 03](./docs/03-harness-why-what-how.md))
4. **How to design a Harness** — state, modes, tools, events mapped to a real product ([doc 04](./docs/04-our-harness-vhld.md))
5. **SSE vs WebSocket vs polling** — and why SSE wins for agent chat ([doc 05](./docs/05-hld-tools-flows.md))
6. **How to pick a tech stack** — with an MVP-first, all-local approach ([doc 06](./docs/06-tech-stack.md))
7. **UI component survey** — palettes, typography, layout wireframes, open questions ([doc 07](./docs/07-ui-system.md))

Plus **3 Architecture Decision Records** showing *why* decisions were made, not just what.

---

## The approach: docs before code

This project follows a deliberate methodology:

```
  docs-only ┐
            │  M0  Origin & idea                    ✅
            │  M1  HyperFrames exploration           ✅
            │  M2  Mastra primer                     ✅
            │  M3  Harness — why / what / how        ✅
            │  M4  Our Harness — VHLD                ✅
            │  M5  HLD — tools, SSE, render          ✅
            │  M6  Tech stack                        ✅
            └  M7  UI system                         ✅

  code      ┐
            │  M8  Scaffold + HelloWorld
            │  M9  Harness loop end-to-end     ← next up
            │  M10 Full editor + tools + chat
            │  M11 Persistence + auth
            │  M12 Polish + deploy
            └  M13 Launch
```

8 docs, 3 ADRs, and 8 journal entries were written before `package.json` existed. That's intentional — designing the system on paper first catches mistakes that are expensive to fix in code.

---

## How the pieces fit

```
  ┌──────────────┐    chat     ┌──────────────┐    tools    ┌──────────────┐
  │              │   ──────►   │              │   ──────►   │              │
  │     You      │             │    Mastra    │             │  HyperFrames │
  │              │   ◄──────   │   Harness    │   ◄──────   │   (render)   │
  │              │    SSE      │              │   compose   │              │
  └──────────────┘   events    └──────────────┘    tree     └──────────────┘
```

- **You** type "add a title slide with the company logo"
- **Mastra Harness** routes to the right agent mode, reasons about the request, calls tools
- **Tools** mutate a canonical composition tree (JSON → HTML)
- **HyperFrames** renders the HTML in a `<hyperframes-player>` web component
- **SSE events** stream the agent's thinking, tool calls, and composition changes to the UI in real time

### MVP stack (all-local, one env var)

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Agent runtime** | Mastra Harness (`@mastra/core`) |
| **Model** | OpenAI `o4-mini` via AI SDK |
| **Storage** | LibSQL (local file DB) |
| **Video engine** | HyperFrames (`<hyperframes-player>`) |
| **UI** | shadcn/ui + Tailwind CSS v4 + Lucide |

The entire product runs with `pnpm dev` + `OPENAI_API_KEY`. No databases, no auth, no cloud services.

---

## Repo layout

```
vibeframes/
├── docs/                 ← start here
│   ├── README.md            doc index + reading guide
│   ├── 00–07-*.md           architecture docs (one per module)
│   ├── decisions/           ADRs (Architecture Decision Records)
│   ├── journal/             build-in-public session logs
│   └── lld/                 low-level designs (coming in M8+)
├── experiments/           standalone spikes
├── assets/                diagrams, screenshots, inspiration
└── docs/meta/             build plan + execution protocol
```

---

## Quick start

**Read the docs** → start with [`docs/README.md`](./docs/README.md)

**Run the app** (coming at M9):
```bash
git clone https://github.com/YOUR_USERNAME/vibeframes.git
cd vibeframes
pnpm install
echo "OPENAI_API_KEY=sk-..." > .env.local
pnpm dev
```

---

## Built in public

Every session is logged in [`docs/journal/`](./docs/journal/). Every non-obvious decision gets an [ADR](./docs/decisions/). The commit history tells the story of the build, module by module.

This project was built using AI pair programming (Cascade / Claude). The process itself — how to work effectively with AI on a real project — is part of what's being documented.

---

## License

[MIT](./LICENSE)

