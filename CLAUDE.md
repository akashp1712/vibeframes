# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Pre-code, docs-first.** The repo currently ships only architecture/design docs. There is no `package.json`, no app scaffold, no test runner. App code lands at the repo root starting at M8. Until then, all work is markdown.

Read `README.md` and `docs/README.md` first — they're the entry points. The full module-based build plan is in `plan.md` (sections 1–10) and `plan-continuation.md` (sections 11–15, execution mechanics).

## Module-based execution model

Work is sequenced as 13 modules (M0 → M13), each scoped to one well-formed deliverable of ~1–3 sessions of ~2hr. Do not jump ahead — module N depends on N-1 being internally consistent. Current state:

- M0 (origin story, doc skeleton) — done
- M1–M7 — docs-only phase (status table in `docs/README.md`)
- After M7 — repo goes public, then code begins
- M8 — Next.js scaffold lands at the repo root (NOT in `experiments/`)
- M9 — first end-to-end Mastra Harness loop with LibSQL
- M10 — main build (8 sub-modules, strict order: M10a → M10h per `plan-continuation.md` §14)
- M11 — Prisma + Neon + Clerk layered on AFTER the core works
- M12–M13 — polish, deploy, launch doc

Module exit criteria (per phase) are in `plan-continuation.md` §12. Don't advance until they're met.

## Per-session protocol

Every session follows the loop in `plan-continuation.md` §11: plan-lock → build → verify → document → journal → decide-next. Each session ends with a journal entry in `docs/journal/session-XX.md` using the template in §13. Update `docs/README.md` status table the same session a doc lands.

## Repo layout & doc conventions

```
docs/
├── README.md                # doc index w/ status table — keep current
├── 00..07-*.md, 99-*.md     # numbered docs, one per module
├── decisions/               # ADRs — short, dated, status-tracked
├── lld/                     # low-level designs, lazy/per-subsystem
└── journal/                 # one entry per session
experiments/                 # standalone spikes (NOT the main app)
assets/{diagrams,inspiration}
```

- **TL;DR at the top of every doc** (read in <30s).
- **ADRs** are created when a non-obvious decision arises — inventory in `plan.md` §5. Don't bury decisions in chat.
- **LLDs** are lazy — write one when a subsystem is non-trivial. Inventory in `plan.md` §6.
- **Diagrams**: inline ASCII for sketches inside docs; SVG (authored in OpenFlowKit) in `assets/diagrams/` for hero diagrams only.

## Hard constraints

- **No `package.json`, no `npm`/`pnpm` until M8.** Modules 0–7 are pure words.
- **Spikes go in `experiments/`**, not at the repo root. The root is reserved for the M8 Next.js app.
- **DB + Clerk are deferred to M11.** M9's Harness loop uses LibSQL file-db only — do not introduce Postgres/Prisma/auth before then.
- **Out-of-scope list (`plan.md` §4)** is binding: MP4 render, observational memory, subagents, plan/build modes, multiplayer, HeyGen avatar block, MCP server, multi-pod state. Don't add these without a new ADR.
- **Single `vibe` mode for MVP** — Composer agent only. No plan/build modes.

## Architecture (the big picture)

VibeFrames is a chat-first AI video studio: a 4-pane editor (asset library · preview · timeline · properties) with a chat panel. Pieces:

- **HyperFrames** (HeyGen) — the rendering engine. HTML-native, deterministic. The browser preview uses a `<hyperframes-player>` web component; MP4 render uses the `hyperframes` CLI (post-launch).
- **Mastra Harness** — the agent runtime. Bundles state (Zod) + storage + memory + modes + workspace + tools + events into one class. The agent and human edit the same canonical composition tree side-by-side.
- **Composition pipeline**: canonical jsonTree → serialize → HyperFrames HTML → player. Mutations are pure functions emitting deltas.
- **Chat transport**: SSE (decision recorded in ADR-001 at M5). Event protocol: `run.start`, `agent.thinking`, `agent.responding`, `tool.{calling,executing,result}`, `composition.delta`, `composition.validate`, `run.{complete,error}`.
- **Stack**: Next.js 15 App Router · Vercel AI SDK + OpenAI (`o4-mini` default, env-swap to `gpt-5.1`) · LibSQL (M9) → PgStore via Neon (M11) · Prisma · Clerk · Vercel Blob.

The chain to internalize: **user chat → Harness mode → Composer agent → tools mutate jsonTree → SSE delta → UI applies delta optimistically → player re-renders.**
