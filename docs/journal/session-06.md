# Session 06 — M5: HLD — Tools, SSE, Render, Composition, UI Bridging

## Goal for this session
- Write the parent HLD that all subsystems flow from.
- Record ADR-001 (SSE chat transport).

## Planned scope
- In: SSE transport rationale + decision matrix, 9-event protocol with payload specs, canonical JSON composition model, mutation operations, serialization pipeline, render pipeline (browser preview vs MP4), UI bridging (event → component mapping, optimistic deltas, chat message anatomy), full request flow diagram
- Out: Zod type definitions (M8 LLD), actual implementation, UI component code (M10)

## What changed
- Docs: `docs/05-hld-tools-flows.md` — 7-section HLD with rich ASCII diagrams:
  - §1 Chat transport: SSE decision matrix (5 options × 7 criteria), sequence diagram, end-to-end flow
  - §2 SSE event protocol: 9-event catalog, lifecycle diagram, wire format examples, reconnection strategy
  - §3 Composition pipeline: canonical JSON tree structure, clip types, pure-function mutations, delta operations, serialization to HyperFrames HTML
  - §4 Render pipeline: browser preview (MVP) vs MP4 export (post-launch via Inngest)
  - §5 UI bridging: 4-pane editor layout wireframe, event → component mapping table, optimistic delta application flow, chat message anatomy
  - §6 Full request flow: end-to-end diagram from user message → route → harness → agent → tools → SSE → UI
- Decisions: `docs/decisions/ADR-001-sse-chat-transport.md` — SSE chosen over polling/req-res/WS/RSC

## Diagram style
- Adopted rich ASCII art style (box-drawing chars, visual flows, labeled arrows, table borders) per user preference

## Verification
- Commands run: none (docs-only)
- Result: HLD is consistent with M4 VHLD (same events, same tool categories, same composition model)

## Next session start point
- First action: write `docs/06-tech-stack.md` (M6)
- Expected output: one paragraph per technology (Next.js, Mastra, AI SDK, Vercel, Neon, LibSQL, Clerk, Vercel Blob) + ADR-002 (model picks) + ADR-003 (LibSQL default)
