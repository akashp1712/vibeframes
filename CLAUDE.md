# CLAUDE.md — AI Pair Programming Instructions

> **For visitors**: This file tells the AI coding assistant (Cascade / Claude) how to work on this project. It's part of how this repo was built — every module was pair-programmed with AI. Leaving it visible is intentional: it's a reference for anyone who wants to see how to structure AI-assisted development on a real project.

---

## Project context

VibeFrames is a chat-first AI video studio built on Mastra Harness + HyperFrames. Read `README.md` for the full picture. See `DEVELOPMENT.md` for local setup.

The build plan (`docs/meta/plan.md`) structures work as 13 modules (M0–M13). Each module ships docs, code, and a journal entry. Module N depends on N-1 being consistent. Current progress is tracked in `docs/README.md`.

**Current state (M10 in progress):** Single-agent Director walks brief → storyboard → compose → validate inside one user turn. Next.js 16 app, `/studio/[projectId]` route, full Vitest + RTL suite, light-mode-first design.

> **Read this first when navigating the harness:** [`docs/harness-architecture.md`](docs/harness-architecture.md) is the single source of truth for how things glue together. It has the repo map, the pipeline diagram, and the "where do I edit X" table. If you're confused, that's where you should look (or fix).

For stricter contributor rules (TDD discipline, shadcn idioms, Zod-everywhere), read `AGENTS.md`. It is the source of truth for code conventions; this file is the higher-level execution protocol.

## Common commands

| Task | Command |
|---|---|
| Dev server (Turbopack) | `pnpm dev` → http://localhost:3000 |
| Production build | `pnpm build` |
| Lint | `pnpm lint` |
| Type-check (no emit) | `pnpm typecheck` |
| All tests | `pnpm test` |
| Watch tests | `pnpm test:watch` |
| Coverage | `pnpm test:coverage` |
| Single test file | `pnpm test path/to/file.test.ts` |
| Single test by name | `pnpm test -t "test name pattern"` |
| Reset local DB / state | `pnpm clear-data` (removes `.data/`) |

CI (`.github/workflows/ci.yml`) runs install → typecheck → test on push/PR to `main`. Husky + lint-staged also gate commits.

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
- **Out-of-scope** (`docs/meta/plan.md` §4): MP4 render, observational memory, multiplayer, HeyGen avatar block, MCP server, multi-pod state. (Subagents were briefly tried in M10 and rolled back — single-agent Director is the architecture; see `docs/harness-architecture.md`.)
- **No unsigned/unreviewed changes** to architecture docs without an ADR

## Architecture summary

**user chat → `/api/chat` → `getVibeFramesHarness(projectId)` → ONE Director Agent runs brief → storyboard → compose → validate in one turn → SSE streams back → preview panel renders.**

Read [`docs/harness-architecture.md`](docs/harness-architecture.md) for the full map. The short version:

- **`src/harness/index.ts`** — singleton `Map<projectId, Harness>`. `yolo: true` because Vercel serverless can't host approval flows. Re-exports the public surface (Composition primitives, mutation helpers).
- **`src/harness/state.ts`** — `VibeFramesStateSchema` (Zod): brief, storyboard, validationReport. Phase is *derived* from state, not stored.
- **`src/harness/director/`** — the single agent. `agent.ts` (Mastra wiring) + `prompt.ts` (state-aware) + `tools.ts` (registry) + `skills/` (workflow / brief / storyboard / design / validate).
- **`src/harness/composition/`** — the artifact: `schema.ts`, `mutations.ts` (pure ops), `store.ts` (disk-backed), `serialize.ts` (jsonTree → HTML), `translator.ts` (beat → clip mutations — the heart of Compose), `validation-rules.ts`.
- **`src/harness/services/clip-registry.service.ts`** — the **block catalog**. Add new blocks here.
- **`src/harness/tools/`** — agent-facing tools (`commit-brief`, `commit-storyboard`, `create-beat`, `check-storyboard`, `list-blocks`, etc.). `tools-internal/` holds low-level mutation primitives the agent never sees.
- **`src/harness/react/`** — `useHarnessChat` (POST /api/chat + SSE stream) and `useComposition` (derive ClipInfo[] from messages).
- **`src/harness/brand-registry.ts`** — canonical hex codes for known brands (Linear, Stripe, …); fallback when LLM emits malformed hex.

Stack: Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (base-nova) · MagicUI · AI SDK v4 · `@mastra/core` · OpenAI `gpt-4o-mini` (override via `VIBEFRAMES_MODEL`) · LibSQL. Chat transport is SSE per ADR-001.

## Things that bite

- **Tools must be Zod-typed in and out.** Untyped tool params silently break the agent loop.
- **Don't bypass `getVibeFramesHarness`.** Constructing a fresh `Harness` per request thrashes LibSQL and loses memory.
- **Catalog data lives in `services/clip-registry.service.ts`**, not in any markdown skill. To add/edit a block: edit that file. The agent reads `list-blocks` (slim catalog: id+description+vars, no template HTML) at runtime, so the description there is what guides selection.
- **The agent NEVER sees `add-clip` / `update-clip` / `remove-clip`.** Those live in `tools-internal/` and are called only by `composition/translator.ts`. Don't expose them to the Director — that breaks the discipline that the translator owns clip emission.
- **The translator's `varsForBlock` does NOT use `beat.concept`** as user-facing copy. The concept is internal storyboard prose; headline copy comes from `brief.brand.name`, `headlineFromMessage(brief.message)`, or `beat.voCue`.
- **Coverage thresholds in `vitest.config.ts` are intentionally off** until the harness loop is feature-complete. Don't re-enable without coordinating.
- **Path alias `@/*` → `src/*`** (defined in `tsconfig.json` and mirrored in `vitest.config.ts`). Use it; relative `../../../` paths are not the convention.
- **Light mode is the default** (root `<html>` has no `dark` class). Use semantic tokens (`bg-primary`, `text-muted-foreground`) — never raw hex or `bg-blue-500`.
