# Session 14 — Subagents Rollback, SSOT, and the MVP Roadmap

**Date**: 2026-06-06
**Module**: M10 closeout + MVP 1.0 declared
**Duration**: ~1 long session

## TL;DR

Closed M10 by (1) declaring **MVP 1.0 shipped** — single Director walks brief → storyboard → compose → validate end-to-end in one turn against `gpt-4o-mini`, (2) rolling back the subagents experiment after measuring a ~24× cost regression, (3) writing `docs/harness-architecture.md` as the single source of truth for the runtime, and (4) producing `docs/analysis/hyperframes-vs-vibeframes.md` to drive the MVP 1.0 → 5.0 quality roadmap. M11 (persistence + Clerk) is the next code module; an MVP 1.0.1 stabilization pass slots in before that.

## What landed

### 1. Subagents rolled back to single Director

Spike (LLD-08 v1) shipped four phase subagents (Brief / Storyboard / Compose / Validate). On the same prompt:

| Path | Tokens | LLM calls | Wall | Quality |
|---|---:|---:|---:|---|
| 4 subagents | ~1.5M | 315 | 2–3 min | identical |
| Single Director | ~64k | ~12 | 30–40s | identical |

~24× cost regression with no measurable quality gain. Root cause: Mastra dynamic tools resolve once per `sendMessage`, not per step — so per-phase tool filtering wasn't actually trimming the LLM context per turn, just costing four extra LLM round-trips for the orchestration. Single Director with all tools registered + per-tool `execute()` out-of-phase guards delivered the same pipeline ordering at 1/24 the cost.

**LLD-08 marked SUPERSEDED**, kept for the *why*. State shape (brief / storyboard / validationReport), YOLO contract, tool ordering discipline, per-phase skills all survived the rollback.

### 2. Catalog and registries trimmed

Cleanup landed (LLD-09 marked Shipped):

- Deleted `src/harness/services/transition-registry.service.ts` — the agent never planned transitions and the translator never consulted it. ~447 tests removed alongside ~700 lines of dead skill markdown.
- Deleted `src/harness/tools/add-transition.ts`.
- Deleted the legacy flat skill bundle (`skills/transitions/`, `skills/effects/`, `skills/social-overlays/`, `skills/blocks/`, `skills/hyperframes/`).
- New runtime skills live at `src/harness/director/skills/{workflow,brief,storyboard,design,validate}/skill.md` — 5 markdown files loaded by Mastra workspace every turn (token cost is negligible).
- Block catalog stable at **20 entries** (3 atomic units + 7 compositions + 1 lower-third + 5 social + 2 follow + 2 effect-overlay).

### 3. Single source of truth — `docs/harness-architecture.md`

Wrote the SSOT after multiple "where do I edit X" sessions. Includes:

- TL;DR pipeline diagram
- Repo map of `src/harness/`
- Catalog vs Skills clarification (the registry holds *data*; skills hold *picking rules*)
- "How to add a new block" recipe
- Pointer table for which file owns what concern

CLAUDE.md updated to reference it as the first stop. README.md, plan.md, future-roadmap.md, catalog.md cross-link to it.

### 4. Brand registry + safe-hex sanitizer

`src/harness/brand-registry.ts` ships ~20 known brands (Linear=#5E6AD2, Stripe=#635BFF, Vercel=#000000, Anthropic=#D97757, …) with a `DEFAULT_BRAND` violet (#7C3AED) fallback.

3-tier color resolution in `commit-brief`:

```
safeHexColor(parsed.brand.primaryColor)   // strict #rgb / #rgba / #rrggbb / #rrggbbaa
  ?? lookupBrand(parsed.brand.name)?.primaryColor
  ?? DEFAULT_BRAND.primaryColor
```

`safeHexColor` is a strict allowlist regex defending against attribute-context XSS in the rendered HTML. Today's silent failure: when the LLM emits a malformed hex, the brand-accent line is dropped without warning. (Filed as MVP 1.0.1 work — see `plan.md`.)

### 5. Live e2e test wired

`pnpm test:e2e` drives the full Director loop against the OpenAI API (gated on `OPENAI_API_KEY` so CI is safe). 5-minute timeout, file-parallelism off. Catches regressions in the prompt and the tool surface.

### 6. HyperFrames packs analysis

Read `.agents/skills/{hyperframes,hyperframes-registry,hyperframes-cli,website-to-hyperframes}` deeply. Wrote `docs/analysis/hyperframes-vs-vibeframes.md` covering:

- Pack-by-pack inventory of capabilities
- VibeFrames-today snapshot
- Side-by-side capability matrix (~20 rows)
- Specific quality gaps in today's output (translator silent fallbacks, no transitions, no entrance discipline, no audits, hard-coded social overlay anchors)
- MVP 1.0 → 5.0 roadmap with effort estimates per item (~20h to MVP 5.0)
- Anti-recommendations (Remotion, multiplayer, MCP, avatars — out of scope)

This drives the new MVP 1.0.1 stabilization section in `plan.md`.

## Doc audit pass

Cross-checked plan/lld/journal/readme docs against current code reality. Updates landed:

- `docs/README.md` — full LLD index with status (Implemented / Planned / Superseded / Shipped); links to harness-architecture as the first stop; module map updated to show M9 ✅ M10 ✅.
- `docs/meta/plan.md` — block count corrected (20, not 21); M10 closure recap rewritten with subagents-rollback context; **MVP 1.0.1 stabilization** section added; MVP 2.0 expanded with effort estimates aligned to the analysis doc.
- `docs/meta/catalog.md` — transitions section replaced with a deletion note + restoration-plan pointer; counts corrected (0 transitions today).
- `docs/meta/future-roadmap.md` — Tier 1 transitions inventory replaced with a deletion note pointing to MVP 2.0 / 4.0 plans.
- `docs/lld/lld-08-phased-director.md` — marked **SUPERSEDED** with rollback context preserved at top.
- `docs/lld/lld-09-codebase-cleanup.md` — marked **Shipped** with what-landed-vs-deferred ledger at top.

## What's next

**MVP 1.0.1 (next session, ~2h)** — silent-failure cleanup (see `plan.md` §4.5 / MVP 1.0.1):

1. Surface `safeHexColor` rejection in validation report
2. Add `rule_varSubstitutionFallback` validation rule
3. Refactor 5 social overlays to use an `anchor` var
4. Broaden `stats-callout` keyword routing
5. Document 1-beat composition path in `design/skill.md`

After 1.0.1: choose between **MVP 2.0** (transitions + entrances + hard-kill — closes the highest-impact HF gap) and **M11** (Clerk + Postgres). Quality-first framing per user's brief argues for MVP 2.0 first.

## Files touched this session

```
docs/
  harness-architecture.md           NEW — runtime SSOT
  analysis/hyperframes-vs-vibeframes.md   NEW — pack inventory + gap matrix + MVP roadmap
  README.md                         updated — LLD index, status table, module map
  meta/plan.md                      updated — block count, M10 recap, MVP 1.0.1 added
  meta/catalog.md                   rewritten — transitions deleted, blocks unchanged
  meta/future-roadmap.md            updated — Tier 1 transitions section retired
  lld/lld-08-phased-director.md     SUPERSEDED status + rollback ledger
  lld/lld-09-codebase-cleanup.md    Shipped status + what-landed-vs-deferred ledger
  journal/session-14-mvp-roadmap.md NEW — this entry

src/harness/
  director/                         single-Director architecture (replaces subagents/)
  composition/                      reorganized (LLD-09 §4)
  brand-registry.ts                 NEW — 20 known brands + safeHexColor sanitizer
  __e2e__/pipeline.live.test.ts     NEW — gated live LLM e2e

CLAUDE.md                            updated — points at harness-architecture.md
```
