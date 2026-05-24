# Session 05 — M4: Our Harness — VHLD

## Goal for this session
- Map the generic Harness shape (from M3) to VibeFrames specifically.
- One big anatomy diagram, five bullets per box, no code.

## Planned scope
- In: state schema (fields + lifecycle categories), vibe mode (agent, model, dynamic prompt structure), four skills, three tool categories with per-tool purpose tables, memory strategy (MVP vs post-launch), 7-event SSE contract, lifecycle flows (creation + usage)
- Out: tool Zod schemas, composition JSON tree spec, SSE wire format, UI components, render pipeline

## What changed
- Docs: `docs/04-our-harness-vhld.md` — 9-section VHLD covering:
  - Big picture anatomy diagram (state, storage, memory, mode, workspace, event bus)
  - State schema with lifecycle categories (hydrated once / per-request / tool-mutated / init flags)
  - Vibe mode (Composer agent, o4-mini, dynamic instructions breakdown)
  - Four skills (hyperframes, composition, captions, audio) with load triggers
  - Three tool categories (context: 4 tools, mutation: 5 tools, validation: 1 tool) with flow pattern
  - Memory strategy (MVP: 20-message history + LibSQL; post-launch: OM, working memory, semantic recall)
  - 7-event SSE contract with payload shapes and UI responses
  - Lifecycle mapped to VibeFrames (creation flow, usage flow with selection injection)
  - Explicit "what this leaves out" section pointing to M5
- Decisions: none new (shape only, no forks)

## Verification
- Commands run: none (docs-only)
- Result: VHLD internally consistent with M3 harness patterns and M1 HyperFrames exploration

## Next session start point
- First action: write `docs/05-hld-tools-flows.md` (M5)
- Expected output: detailed HLD covering SSE transport rationale + ADR-001, composition JSON tree spec, tool schemas, render pipeline, UI bridging
