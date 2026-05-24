# VibeFrames — Docs

The project's spine. Each doc tackles one problem thoughtfully. Read in order if you're new; jump anywhere if you're not.

## Reading order

| # | Doc | Status | What it answers |
|---|---|---|---|
| 00 | [origin-story](./00-origin-story.md) | ✅ drafted | Why this project exists |
| 01 | [hyperframes-exploration](./01-hyperframes-exploration.md) | ✅ drafted | What HyperFrames is, where an agent multiplies it |
| 02 | [mastra-primer](./02-mastra-primer.md) | ✅ drafted | AI SDK → LLM → Agent → Tools → Workflows |
| 03 | [harness-why-what-how](./03-harness-why-what-how.md) | ✅ drafted | What is the Mastra `Harness` class, why does it exist |
| 04 | [our-harness-vhld](./04-our-harness-vhld.md) | ✅ drafted | Harness anatomy mapped to VibeFrames |
| 05 | [hld-tools-flows](./05-hld-tools-flows.md) | ✅ drafted | Chat (SSE rationale), composition, render, UI bridging |
| 06 | [tech-stack](./06-tech-stack.md) | ⏳ todo | Next.js, Mastra, OpenAI, Neon, Prisma, Clerk, Vercel |
| 07 | [ui-system](./07-ui-system.md) | ⏳ todo | Branding, palette, type, components, wireframes |
| 99 | [deployment-considerations](./99-deployment-considerations.md) | ⏳ todo | Prod gotchas (Vercel timeouts, SSE, cold starts, cost) |
| 99 | [lessons-learned](./99-lessons-learned.md) | ⏳ ongoing | Gotchas captured as we hit them |

## Sub-folders

- **[`decisions/`](./decisions/)** — ADRs. Short, dated, status-tracked records of every non-obvious decision
- **[`lld/`](./lld/)** — Low-level designs. One per subsystem, written when the subsystem is non-trivial
- **[`journal/`](./journal/)** — One entry per work session. Build-in-public log

## Module map

The build is structured as 13 modules (M0 → M13). Each module solves one problem and ships its own doc + (later) code + journal entry. The full module plan lives at the project root in `vibeframes-v6-eae326.md` (in `.windsurf/plans/`).

```
docs-only ┐
          │  M0  Origin & idea
          │  M1  HyperFrames exploration
          │  M2  Mastra primer
          │  M3  Harness — why / what / how
          │  M4  Our Harness — VHLD
          │  M5  HLD — tools, SSE, render, composition ←── you are here
          │  M6  Tech stack base
          └  M7  UI system

🚀 GO PUBLIC after M7

code      ┐
          │  M8  Scaffold + HelloWorld + LLDs
          │  M9  Harness HelloWorld (LibSQL, no auth)
          │  M10 The real thing (8 sub-modules)
          │  M11 Add Prisma + Neon + Clerk
          │  M12 Polish + deploy
          └  M13 Deployment considerations + launch
```

## Conventions

- **Every doc opens with a TL;DR** — read in <30 seconds.
- **ADRs** follow the template in `decisions/README.md` (lands with ADR-001).
- **LLDs** follow the template in `lld/README.md` (lands with LLD-01).
- **Diagrams**:
  - **Inline ASCII** for quick architecture sketches inside docs (fast, version-controlled, scannable).
  - **SVG** in `assets/diagrams/` for hero diagrams (system context, Harness anatomy, SSE flow). Authored in [OpenFlowKit](https://openflowkit.com/) (diagram-as-code, free, local-first), exported as SVG, embedded with relative paths.
  - **MP4** cinematic export from OpenFlowKit for the launch demo only — keep it to one or two.
