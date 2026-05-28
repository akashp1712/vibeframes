# CLAUDE.md — AI Pair Programming Instructions

> **For visitors**: This file tells the AI coding assistant (Cascade / Claude) how to work on this project. It's part of how this repo was built — every module was pair-programmed with AI. Leaving it visible is intentional: it's a reference for anyone who wants to see how to structure AI-assisted development on a real project.

---

## Project context

VibeFrames is a chat-first AI video studio built on Mastra Harness + HyperFrames. Read `README.md` for the full picture. See `DEVELOPMENT.md` for local setup.

The build plan (`docs/meta/plan.md`) structures work as 13 modules (M0–M13). Each module ships docs, code, and a journal entry. Module N depends on N-1 being consistent. Current progress is tracked in `docs/README.md`.

**Current state (M8 complete):** Scaffold shipped — Next.js 16 app with landing page, `/studio` route (3-pane UI), harness type scaffolding, full test suite (Vitest + RTL), GitHub Actions CI, light-mode-first design with indigo accent and MagicUI micro-animations.

## Execution protocol

Every session follows: **plan-lock → build → verify → document → journal → decide-next** (details in `docs/meta/plan-continuation.md`).

- End each session with `docs/journal/session-XX.md`
- Update `docs/README.md` status table when a doc lands
- Record non-obvious decisions as ADRs in `docs/decisions/`

## Repo conventions

```
src/                         all app code (app, components, harness, lib)
docs/                        architecture docs, ADRs, LLDs, journal
docs/meta/                   build plan + execution protocol
experiments/                 standalone spikes (NOT the main app)
assets/{diagrams,inspiration}
```

- **TL;DR** at the top of every doc
- **ADRs** when a non-obvious decision arises — inventory in `docs/meta/plan.md` §5
- **LLDs** are lazy — one per non-trivial subsystem
- **Diagrams**: rich ASCII art inline; SVG in `assets/diagrams/` for hero visuals only

## Hard constraints

- **All app code in `src/`** — docs, experiments, configs stay at root
- **Spikes go in `experiments/`** — not in `src/`
- **DB + Clerk deferred to M11** — M9 uses LibSQL file-db only
- **MVP is all-local** — only external dep is `OPENAI_API_KEY`
- **Out-of-scope** (`docs/meta/plan.md` §4): MP4 render, observational memory, subagents, multiplayer, HeyGen avatar block, MCP server, multi-pod state
- **No unsigned/unreviewed changes** to architecture docs without an ADR

## Architecture summary

**user chat → Harness mode → Composer agent → tools mutate jsonTree → SSE delta → UI applies delta → HyperFrames player re-renders**

- **Stack**: Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (base-nova) · MagicUI · AI SDK v4 · Mastra Harness · OpenAI `o4-mini` · LibSQL (MVP) → PgStore (M11)
- **Chat transport**: SSE (ADR-001)
- **Testing**: Vitest + React Testing Library + jsdom — TDD required (see `AGENTS.md`)
- **UI mode**: Light mode default (like Vercel), indigo primary accent
- **Composition**: jsonTree → serialize → HyperFrames HTML → `<hyperframes-player>`
