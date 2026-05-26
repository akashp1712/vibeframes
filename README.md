# VibeFrames

> **A Mastra Harness agent that composes videos through conversation.** You describe what you want. The agent reasons, calls tools, and builds a [HyperFrames](https://github.com/heygen-com/hyperframes) composition — clip by clip, track by track — while you watch.

<!-- TODO: add demo GIF at M9 -->

---

## How it works

```
  ┌──────────────┐    chat     ┌──────────────┐    tools    ┌──────────────┐
  │              │   ──────►   │              │   ──────►   │              │
  │     You      │             │    Mastra    │             │  HyperFrames │
  │   describe   │             │   Harness    │             │   (render)   │
  │   a video    │   ◄──────   │   agent      │   ◄──────   │              │
  │              │    SSE      │              │   compose   │              │
  └──────────────┘   events    └──────────────┘    tree     └──────────────┘
```

1. **You type** "add a title slide with the company logo"
2. **Harness** routes to the right agent mode (plan or vibe), reasons about the request
3. **Tools** mutate a canonical composition tree — typed state, Zod-validated inputs/outputs
4. **HyperFrames** renders the composition as HTML in a `<hyperframes-player>` web component
5. **SSE events** stream reasoning, tool calls, and composition deltas to the UI in real time

The agent and human edit the same composition tree side by side — chat on one side, timeline on the other.

---

## The stack

| Layer | Technology | Why |
|---|---|---|
| **Agent runtime** | [Mastra](https://mastra.ai) Harness | Typed state, modes, tools, memory, event bus — one class |
| **Video engine** | [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML-native, deterministic, agent-friendly by design |
| **Model** | OpenAI `o4-mini` via [AI SDK](https://sdk.vercel.ai) | Reasoning-capable, cheap, fast |
| **Framework** | Next.js 15 (App Router) | SSE route handlers, RSC, server actions |
| **Storage** | LibSQL (local file) | Zero-config, survives restarts, swappable to Postgres |
| **UI** | shadcn/ui + Tailwind CSS v4 | Copy-paste components, utility-first styling |

**MVP runs fully local** — `pnpm dev` + one env var (`OPENAI_API_KEY`). No databases, no auth, no cloud services.

---

## What's inside

The architecture was designed before the code. Every decision is documented with rationale and diagrams.

| Doc | What it covers |
|---|---|
| [HyperFrames exploration](./docs/01-hyperframes-exploration.md) | The video engine — blocks, player, CLI, where agents fit |
| [Mastra primer](./docs/02-mastra-primer.md) | AI SDK → Agent → Tools → Memory, bottom-up |
| [Harness deep-dive](./docs/03-harness-why-what-how.md) | Why Harness exists, four stores, lifecycle, production patterns |
| [Our Harness design](./docs/04-our-harness-vhld.md) | State schema, two modes, tools, events — mapped to VibeFrames |
| [HLD — tools & flows](./docs/05-hld-tools-flows.md) | SSE protocol, composition pipeline, render, UI bridging |
| [Tech stack](./docs/06-tech-stack.md) | Every choice with rationale — MVP-first, upgrade path documented |
| [UI exploration](./docs/07-ui-system.md) | Palettes, typography, component survey, wireframes |

**3 ADRs** ([SSE transport](./docs/decisions/ADR-001-sse-chat-transport.md), [LLM strategy](./docs/decisions/ADR-002-llm-provider-reasoning.md), [storage](./docs/decisions/ADR-003-storage-strategy.md)) record the non-obvious decisions.

Start reading → [`docs/README.md`](./docs/README.md)

---

## Project status

```
  design    ┐
            │  M0  Origin & idea                    ✅
            │  M1  HyperFrames exploration           ✅
            │  M2  Mastra primer                     ✅
            │  M3  Harness — why / what / how        ✅
            │  M4  Our Harness — VHLD                ✅
            │  M5  HLD — tools, SSE, render          ✅
            │  M6  Tech stack                        ✅
            └  M7  UI system                         ✅

  build     ┐
            │  M8  Scaffold + HelloWorld             ← next up
            │  M9  Harness loop end-to-end
            │  M10 Full editor + tools + chat
            │  M11 Persistence + auth
            │  M12 Polish + deploy
            └  M13 Launch
```

---

## Quick start

**Explore the architecture** → [`docs/README.md`](./docs/README.md)

**Run the app** (coming at M9):
```bash
git clone https://github.com/AkashKumar7902/vibeframes.git
cd vibeframes
pnpm install
echo "OPENAI_API_KEY=sk-..." > .env.local
pnpm dev
```

---

## Repo layout

```
vibeframes/
├── docs/                 architecture docs, ADRs, journal, LLDs
│   ├── 00–07-*.md           one doc per design module
│   ├── decisions/           Architecture Decision Records
│   ├── journal/             session-by-session build log
│   └── meta/                build plan + execution protocol
└── experiments/           standalone spikes
```

---

## License

[MIT](./LICENSE)

