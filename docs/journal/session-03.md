# Session 03 — M2: Mastra Primer

## Goal for this session
- Build the bottom-up mental model: AI SDK → LLM → Agent → Tool → Workflow → Memory.
- One code snippet per concept, one "why this matters for VibeFrames" note each.

## Planned scope
- In: primer doc covering all six Mastra concepts with code, comparison tables, concept stack diagram
- Out: running code, Harness (that's M3), deep-dive into any single concept

## What changed
- Docs: `docs/02-mastra-primer.md` — 9-section primer covering:
  - AI SDK (`generateText`, `streamText`, model router)
  - LLM + reasoning params (`reasoningEffort`, `reasoningSummary` for o4-mini)
  - Agent (instructions, model, tools, `.generate()` vs `.stream()`, agent vs raw streamText comparison)
  - Tool (`createTool`, Zod schemas, three VibeFrames tool categories mapped)
  - Workflow (`createStep`, `createWorkflow`, agent vs workflow comparison, deferred for MVP)
  - Memory (message history, resource/thread model, storage provider, memory types table with VibeFrames plan)
  - Mastra instance (wiring it all together)
  - Concept stack diagram (bottom-up ASCII)
- Decisions: none new

## Verification
- Commands run: none (docs-only module)
- Manual smoke: n/a
- Result: doc internally consistent with M1 exploration and plan

## Risks / open questions
- Mastra model router syntax `'openai/o4-mini'` confirmed from current docs — verify at M9 when actually installing.
- AI SDK v5 uses `LanguageModelV2` — Mastra provides `toAISdkV5Stream()` bridge. Need to confirm compatibility at M9.
- `reasoningEffort` and `reasoningSummary` are OpenAI-specific — passed via model config at call time, not agent constructor.

## Next session start point
- First action: write `docs/03-harness-why-what-how.md` (M3)
- Expected output: conceptual deep-dive into why Harness exists, what it bundles, how its lifecycle works, referencing mc-studio's HARNESS-OVERVIEW.md + Mastra docs
