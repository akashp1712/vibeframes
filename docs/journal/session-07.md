# Session 07 — M6: Tech Stack

**Date**: 2025-05-24  
**Module**: M6 — Tech stack base  
**Duration**: ~1 session  

## What shipped

- `docs/06-tech-stack.md` — 14-section tech stack doc covering every technology choice with rationale, alternative rejected, and what we're learning
- `docs/decisions/ADR-002-llm-provider-reasoning.md` — OpenAI o4-mini with reasoningEffort control, env-swap to gpt-5.1
- `docs/decisions/ADR-003-storage-strategy.md` — LibSQL for MVP, flag-swap to PgStore in M11, separate app data layer via Prisma + Neon

## Key decisions

1. **o4-mini default** with `reasoningEffort` as the mode differentiator (low for plan, medium for vibe). gpt-5.1 available via env var.
2. **LibSQL → PgStore flag-swap** — zero-config local dev, production-grade with one env var change.
3. **Two storage layers** — Mastra storage (agent internals) and Prisma (app data) stay separate.
4. **Vercel hosting** with awareness of timeout constraints (30s Hobby / 300s Pro).
5. **pnpm, no monorepo** for MVP — single Next.js app at repo root.
6. **< 20 direct dependencies** target for MVP.

## Also done this session

- Enriched `docs/03-harness-why-what-how.md` (469 → 997 lines): four stores, sendMessage internals, lifecycle visual timeline, recovery scenarios, 5 production patterns

## Risks

- **Vercel 30s Hobby timeout** — multi-tool agent turns may exceed this. Accept for MVP; Pro plan for production.
- **Model lock-in** — AI SDK provider abstraction mitigates this (one-line swap).
- **LibSQL single-process** — fine for dev, requires PgStore for Vercel serverless.

## Next session

- **M7** — UI System: branding, palette, typography, component picks, wireframes, ADR-004
- After M7: repo goes public, LinkedIn post #1
