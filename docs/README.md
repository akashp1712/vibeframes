# VibeFrames — Documentation

> Architecture and design docs for a Mastra Harness agent that composes HyperFrames videos. Every doc opens with a **TL;DR** you can read in under 30 seconds.

---

## Where to start

- **`harness-architecture.md`** — single source of truth for the runtime today (repo map, pipeline, "where do I edit X" table). **Read this first** when navigating the harness.
- **Docs 00–03** build the foundation: what HyperFrames is, how Mastra works, what a Harness is.
- **Docs 04–06** are the design: our Harness shape, tool/event protocol, tech stack.
- **Doc 07** explores UI direction: palettes, typography, components, wireframes.
- **`decisions/`** has the ADRs — the *why* behind non-obvious choices.
- **`lld/`** has the per-subsystem low-level designs.
- **`journal/`** has the session-by-session build log.
- **`meta/plan.md`** is the build plan. **`meta/catalog.md`** is the live block catalog inventory. **`meta/future-roadmap.md`** is the post-MVP backlog.

---

## Reading order

| # | Doc | What it answers |
|---|---|---|
| ★ | [harness-architecture](./harness-architecture.md) | Runtime SSOT — repo map, pipeline, edit-X table |
| 00 | [origin-story](./00-origin-story.md) | Why this project exists |
| 01 | [hyperframes-exploration](./01-hyperframes-exploration.md) | What HyperFrames is, where an agent multiplies it |
| 02 | [mastra-primer](./02-mastra-primer.md) | AI SDK → LLM → Agent → Tools → Workflows |
| 03 | [harness-why-what-how](./03-harness-why-what-how.md) | What a Mastra Harness is and why it exists |
| 04 | [our-harness-vhld](./04-our-harness-vhld.md) | Harness anatomy mapped to VibeFrames |
| 05 | [hld-tools-flows](./05-hld-tools-flows.md) | SSE transport, event protocol, composition pipeline, UI bridging |
| 06 | [tech-stack](./06-tech-stack.md) | MVP-first tech choices (all-local, one env var) |
| 07 | [ui-system](./07-ui-system.md) | Design exploration — palettes, typography, components, wireframes |

## Decisions

| ADR | Topic | Status |
|---|---|---|
| [ADR-001](./decisions/ADR-001-sse-chat-transport.md) | SSE chat transport vs WebSocket / polling | Accepted |
| [ADR-002](./decisions/ADR-002-llm-provider-reasoning.md) | LLM provider + reasoning strategy | Accepted |
| [ADR-003](./decisions/ADR-003-storage-strategy.md) | Storage: all-local MVP → PgStore later | Accepted |
| ADR-004 | UI component stack (proposed in doc 07, confirmed at M8) | Implicit |

## Low-Level Designs

| LLD | Topic | Status |
|---|---|---|
| [LLD-01](./lld/lld-01-app-structure.md) | App structure — folder conventions, import rules, test structure | Implemented |
| [LLD-02](./lld/lld-02-composition-model.md) | Composition model — types, mutations, serialization, clip registry | Implemented |
| [LLD-03](./lld/lld-03-harness-wiring.md) | Mastra Harness wiring (state, modes, memory, services) | Implemented |
| [LLD-04](./lld/lld-04-sse-protocol.md) | SSE chat protocol — envelope, event types, client loop | Implemented |
| [LLD-05](./lld/lld-05-harness-architecture-deep.md) | Harness architecture deep-dive (skills > tools > prompt) | Reference |
| [LLD-06](./lld/lld-06-studio-adoption.md) | `@hyperframes/studio` adoption tiers (Player → Timeline → Inspector) | Planned (post-MVP) |
| [LLD-07](./lld/lld-07-captions.md) | Captions: model, registry, tools, skill | Planned (MVP 2.0/3.0) |
| [LLD-08](./lld/lld-08-phased-director.md) | Phased Director — subagent spike (rolled back; **SUPERSEDED**) | Superseded by [`harness-architecture.md`](./harness-architecture.md) |
| [LLD-09](./lld/lld-09-codebase-cleanup.md) | Codebase cleanup & hierarchical reorganization | Shipped |

## Sub-folders

- **[`decisions/`](./decisions/)** — Architecture Decision Records. Short, dated, status-tracked.
- **[`lld/`](./lld/)** — Low-level designs. One per subsystem, written when the subsystem is non-trivial.
- **[`journal/`](./journal/)** — One entry per work session. The build-in-public log.
- **[`meta/`](./meta/)** — Build plan (`plan.md`), live catalog (`catalog.md`), backlog (`future-roadmap.md`), execution protocol (`plan-continuation.md`).

## Module map

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
          │  M8  Scaffold + Studio UI + LLDs       ✅
          │  M9  Harness loop end-to-end           ✅
          │  M10 Full Studio + tools + chat        ✅ (MVP 1.0 = today)
          │  M10.1 MVP 1.0 stabilization           ← next up
          │  M11 Persistence + Clerk multi-tenancy
          │  M12 Polish + deploy
          └  M13 Launch
```

The full module plan with details lives in [`meta/plan.md`](./meta/plan.md).
The MVP 1.0 → 5.0 quality roadmap lives in [`meta/plan.md` §4.5](./meta/plan.md).

## Conventions

- **Every doc opens with a TL;DR** — scannable in <30 seconds.
- **ADRs** are created when a non-obvious decision arises. One decision, one file.
- **LLDs** are lazy — written only when a subsystem is complex enough to warrant its own design doc. Mark `Superseded` when a later doc replaces it.
- **Diagrams**: rich ASCII art inline (version-controlled, scannable). SVG in `assets/diagrams/` for hero visuals only.
