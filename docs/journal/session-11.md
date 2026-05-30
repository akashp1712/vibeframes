# Session 11 — M9: Mastra Harness + Agent Loop

**Date**: 2026-05-29
**Module**: M9 — Agent loop end-to-end
**Duration**: ~1 session

## What shipped

### Real Mastra Harness on the server

- Ripped out raw `streamText` from AI SDK. Wired in `@mastra/core/harness` + `@mastra/memory` per the `mc-studio-services` blueprint.
- New file layout under `src/harness/`:
  - `index.ts` → `createVibeFramesHarness`, `getVibeFramesHarness` (per-projectId cache)
  - `state.ts` → `VibeFramesStateSchema` with `yolo:true`
  - `mode.ts` → `createDirectorMode` (single mode named **Director**)
  - `prompts/composer.ts` → `buildDirectorPrompt`
  - `services/` → `HarnessServices` + `clipRegistry` (Tailwind block catalog)
  - `tools/` → factories for `add-clip`, `update-clip`, `remove-clip`, `get-composition`, `get-block-schemas`
  - `skills/hyperframes/skill.md` → YAML-frontmatter skill loaded by Mastra Workspace

### Custom SSE protocol

- `src/protocol/sse-writer.ts` + `events.ts` — `VibeFramesEvent` envelope (`v`, `runId`, `seq`, `projectId`, `ts`, `type`, `payload`), Next.js `ReadableStream`-friendly writer.
- `src/app/api/chat/route.ts` — tiny route: subscribe → sendMessage → relay events. Filters out high-frequency `display_state_changed` / `tool_input_*` noise. Monotonic `seq` per `runId`. Heartbeat every 5s.

### Custom React hook (replaced `useChat`)

- `src/harness/use-harness-chat.ts` — fetches POST, parses SSE blocks, dispatches on event type. Exposes `messages`, `status`, `activeToolName`, `error`, plus `input`/`handleInputChange`/`handleSubmit`.
- Status transitions: `idle → thinking → calling-tool → streaming → done | error`.

### Studio UI wired to harness events

- **ChatPanel** — shows distinct status indicators per phase: spinner for thinking, pulse Wrench + tool name for calling-tool, Sparkles for streaming.
- **ChatMessage / ToolCard** — green check on success, red Alert on error, spinner while running, duration badge (ms), summary line per tool name (`add-clip`/`remove-clip`/`update-clip`/`get-composition`/`get-block-schemas`).
- **PreviewPanel** — iframe srcDoc now embeds Tailwind CDN + GSAP and a small player (play/pause/restart/scrub) that reads `data-start`/`data-duration` from each clip and fades them in sequentially. Real animated preview, not a static dump.

### LLD docs + ADR

- `docs/lld/lld-03-harness-wiring.md` — Harness boot, mode/state/services/tools/skills layout, yolo rationale.
- `docs/lld/lld-04-sse-protocol.md` — envelope shape, event taxonomy, server + client implementations, why not `useChat` / `EventSource`.

### Validation

- `pnpm typecheck` clean.
- `pnpm test` — 14 files, 63 tests passing.
- Live `curl` against `/api/chat` produced clean stream:
  ```
  run.start → tool_start ×2 → tool_end ×2 → run.complete
  ```
- Generated a 3-clip Vercel AI Gateway intro composition; preview written to `experiments/composition-preview/vercel-intro-animated.html` showing real GSAP-driven playback.

## Notable rabbit holes

- **AI SDK v4 vs v6 peer dep**: Mastra pulls `chat@4.29.0` which wants `ai@^6`. Bumped `ai`, `@ai-sdk/openai`, `@ai-sdk/react` to v6 line.
- **`useChat` API broke**: `input`, `handleInputChange`, `handleSubmit`, `isLoading` removed in v6. Decided to write our own hook anyway since we own the SSE protocol now.
- **Tool approval deadlock**: harness emitted `tool_approval_required` and stalled. Found `PermissionPolicy = "allow"|"ask"|"deny"` system; mc-studio-services solves it via `state.yolo = true`. Adopted the same convention.
- **Skill YAML frontmatter**: Mastra Workspace requires `name` + `description` in frontmatter or throws "Invalid skill metadata".

## Pending / followups

- Replace `InMemoryStore` with LibSQL or Postgres for persistence.
- Add Director **+ Editor** mode split (high-level vs precise edits).
- Asset registry service (Unsplash/Pexels image search).
- Reconnection / resume from `seq` when SSE drops.
- Connect M9c tool-output enrichment (e.g. `clip-added` event into the preview without waiting for `tool_end`).

## File map this session

```
src/harness/                         (overhauled)
  index.ts                           harness factory + cache
  state.ts                           Zod + yolo
  mode.ts                            createDirectorMode
  prompts/{index,composer}.ts        director prompt
  services/{index,types,clip-registry.service}.ts
  tools/{add,update,remove,get}-clip.ts + get-block-schemas.ts + index.ts
  skills/hyperframes/skill.md
  use-harness-chat.ts                NEW — replaces useChat
  use-composition.ts                 adapted to ChatMessage shape

src/protocol/
  events.ts                          VibeFramesEvent
  sse-writer.ts                      createSSEStream()

src/app/api/chat/route.ts            rewritten — subscribe + dispatch
src/app/studio/page.tsx              passes status + activeToolName
src/components/studio/{chat-panel,chat-message,preview-panel}.tsx  re-wired
docs/lld/lld-03-harness-wiring.md    NEW
docs/lld/lld-04-sse-protocol.md      NEW
experiments/composition-preview/     NEW — static + animated previews
```
