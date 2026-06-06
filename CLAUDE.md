# CLAUDE.md — AI Pair Programming Instructions

> **For visitors**: This file tells the AI coding assistant (Cascade / Claude) how to work on this project. It's part of how this repo was built — every module was pair-programmed with AI. Leaving it visible is intentional: it's a reference for anyone who wants to see how to structure AI-assisted development on a real project.

---

## Project context

VibeFrames is a chat-first AI video studio built on Mastra Harness + HyperFrames. Read `README.md` for the full picture. See `DEVELOPMENT.md` for local setup.

The build plan (`docs/meta/plan.md`) structures work as 13 modules (M0–M13). Each module ships docs, code, and a journal entry. Module N depends on N-1 being consistent. Current progress is tracked in `docs/README.md`.

**Current state (M9 complete):** Harness loop is end-to-end. Next.js 16 app with landing page and `/studio/[projectId]` route, working `Harness<VibeFramesState>` (single Director mode) backed by LibSQL, SSE chat route, composition mutations + serialize → HyperFrames, full Vitest + RTL suite, GitHub Actions CI, light-mode-first design.

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
- **Out-of-scope** (`docs/meta/plan.md` §4): MP4 render, observational memory, subagents, multiplayer, HeyGen avatar block, MCP server, multi-pod state
- **No unsigned/unreviewed changes** to architecture docs without an ADR

## Architecture summary

**user chat → `/api/chat` route → `getVibeFramesHarness(projectId)` → Director mode → tool calls mutate composition → SSE events stream back → client applies delta → `<hyperframes-player>` re-renders**

Key modules in `src/harness/`:

- **`index.ts`** — singleton `Map<projectId, Harness>` with `createVibeFramesHarness` / `getVibeFramesHarness`. `yolo: true` is set in initial state because Vercel's serverless runtime can't host stateful approval flows.
- **`state.ts` / `types.ts`** — `VibeFramesStateSchema` (Zod). All harness state, tool params, and API payloads must be Zod-validated.
- **`mode.ts`** — single `Director` mode (the dual plan/vibe split described in `docs/04-our-harness-vhld.md` collapsed during M9; do not reintroduce without an ADR).
- **`tools/`** — `add-clip`, `update-clip`, `remove-clip`, `add-transition`, `get-composition`, `get-block-schemas`, `get-transition-schemas`. Tools mutate the composition tree and emit `composition.delta` SSE events.
- **`mutations.ts`** — pure functions on the composition tree (used by tools, never call Harness state directly from UI).
- **`serialize.ts`** — `jsonTree → HyperFrames HTML`.
- **`storage.ts`** — LibSQL store; `VIBEFRAMES_DB_URL` + `VIBEFRAMES_DB_AUTH_TOKEN` swap to Turso.
- **`skills/`** — runtime markdown skills the Mastra agent reads each turn. **Different from `.agents/skills/`** — those are reference-only for coding agents (see `AGENTS.md` §Skills).
- **`use-composition.ts` / `use-harness-chat.ts`** — React hooks that bridge SSE events to the studio panels.

Stack: Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (base-nova) · MagicUI · AI SDK v4 · `@mastra/core` · OpenAI `o4-mini` · LibSQL (file-db today; Turso for serverless; PgStore in M11). Chat transport is SSE per ADR-001 — do not switch to WebSockets without a new ADR.

## Things that bite

- **Tools must be Zod-typed in and out.** Untyped tool params silently break the agent loop.
- **Don't bypass `getVibeFramesHarness`.** Constructing a fresh `Harness` per request thrashes LibSQL and loses memory.
- **Coverage thresholds in `vitest.config.ts` are intentionally off** until the harness loop is feature-complete (see the comment in that file). Don't re-enable without coordinating — many `tools/`, `app/api/`, and `studio/` files are 0% by design.
- **Path alias `@/*` → `src/*`** (defined in `tsconfig.json` and mirrored in `vitest.config.ts`). Use it; relative `../../../` paths are not the convention.
- **Light mode is the default** (root `<html>` has no `dark` class). Use semantic tokens (`bg-primary`, `text-muted-foreground`) — never raw hex or `bg-blue-500`.
