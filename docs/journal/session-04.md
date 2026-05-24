# Session 04 — M3: Harness — Why, What, How

## Goal for this session
- Conceptual deep-dive into Mastra's Harness class.
- Answer: why does it exist, what does it bundle, how does its lifecycle work.

## Planned scope
- In: Harness anatomy, lifecycle, state, storage, memory, modes, workspace/skills, tools, events, comparison with raw Agent, reference to mc-studio implementation
- Out: VibeFrames-specific mapping (that's M4), code implementation, SSE protocol details (that's M5)

## What changed
- Docs: `docs/03-harness-why-what-how.md` — 8-section deep-dive covering:
  - Why — 8-row comparison table (plain Agent vs Harness)
  - What — anatomy diagram + 7 subsections (state, storage, memory, modes, workspace/skills, tools, events)
  - How — lifecycle diagrams (creation vs usage), sendMessage flow, instance methods table
  - Creation-is-expensive / usage-is-cheap principle
  - Dynamic instructions pattern (state drives the prompt)
  - Side-by-side code comparison (without vs with Harness)
  - Reference to mc-studio's proven implementation (16 tools, 6+ skills, OM, SSE)
- Decisions: none new

## Verification
- Commands run: none (docs-only module)
- Result: doc references mc-studio's HARNESS-OVERVIEW.md and HARNESS-ARCHITECTURE-BASICS.md patterns; internally consistent with M2 primer

## Risks / open questions
- Harness API may have changed since mc-studio was built — verify `subscribe()`, `sendMessage()`, `setState()` signatures at M9 when installing Mastra.
- `requestContext.get('harness')` pattern for tools accessing state — confirm this is the current API.
- Single-pod assumption for in-memory cache — documented as out-of-scope for MVP.

## Next session start point
- First action: write `docs/04-our-harness-vhld.md` (M4)
- Expected output: VibeFrames Harness shape — state schema, vibe mode, skills list, tool categories, memory strategy, events emitted
