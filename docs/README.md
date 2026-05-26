# VibeFrames — Documentation

> The project's spine. 8 architecture docs, 3 ADRs, and 8 journal entries — all written before the first line of application code.

---

## How to read these docs

**If you're learning Mastra / Harness engineering**, read docs 00–03 in order. They build a mental model from zero: origin story → HyperFrames → AI SDK basics → what a Harness is and why it exists.

**If you're evaluating the architecture**, jump to docs 04–06: the Harness design, HLD, and tech stack. The ADRs in `decisions/` explain the *why* behind each non-obvious choice.

**If you're here for the UI exploration**, doc 07 has palette candidates, typography pairings, component surveys, and ASCII wireframes.

**If you want the build process**, the `journal/` folder has one entry per session — wins, friction, and next steps.

Every doc opens with a **TL;DR** you can read in under 30 seconds.

---

## Reading order

| # | Doc | What it answers |
|---|---|---|
| 00 | [origin-story](./00-origin-story.md) | Why this project exists |
| 01 | [hyperframes-exploration](./01-hyperframes-exploration.md) | What HyperFrames is, where an agent multiplies it |
| 02 | [mastra-primer](./02-mastra-primer.md) | AI SDK → LLM → Agent → Tools → Workflows |
| 03 | [harness-why-what-how](./03-harness-why-what-how.md) | What a Mastra Harness is and why it exists |
| 04 | [our-harness-vhld](./04-our-harness-vhld.md) | Harness anatomy mapped to VibeFrames |
| 05 | [hld-tools-flows](./05-hld-tools-flows.md) | SSE transport, event protocol, composition pipeline, UI bridging |
| 06 | [tech-stack](./06-tech-stack.md) | MVP-first tech choices (all-local, one env var) |
| 07 | [ui-system](./07-ui-system.md) | Design exploration — palettes, typography, components, wireframes |

## Decisions

| ADR | Topic |
|---|---|
| [ADR-001](./decisions/ADR-001-sse-chat-transport.md) | SSE chat transport vs WebSocket / polling |
| [ADR-002](./decisions/ADR-002-llm-provider-reasoning.md) | LLM provider + reasoning strategy |
| [ADR-003](./decisions/ADR-003-storage-strategy.md) | Storage: all-local MVP → PgStore later |
| ADR-004 | UI component stack (proposed in doc 07, confirmed at M8) |

## Sub-folders

- **[`decisions/`](./decisions/)** — Architecture Decision Records. Short, dated, status-tracked.
- **[`lld/`](./lld/)** — Low-level designs. One per subsystem, written when the subsystem is non-trivial. Coming in M8+.
- **[`journal/`](./journal/)** — One entry per work session. The build-in-public log.
- **[`meta/`](./meta/)** — Build plan and execution protocol. How the project is structured and sequenced.

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
          │  M8  Scaffold + HelloWorld             ← next up
          │  M9  Harness loop end-to-end
          │  M10 Full editor + tools + chat
          │  M11 Persistence + auth
          │  M12 Polish + deploy
          └  M13 Launch
```

The full module plan with details lives in [`meta/plan.md`](./meta/plan.md).

## Conventions

- **Every doc opens with a TL;DR** — scannable in <30 seconds.
- **ADRs** are created when a non-obvious decision arises. One decision, one file.
- **LLDs** are lazy — written only when a subsystem is complex enough to warrant its own design doc.
- **Diagrams**: rich ASCII art inline (version-controlled, scannable). SVG in `assets/diagrams/` for hero visuals only.
