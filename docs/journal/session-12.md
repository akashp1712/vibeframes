# Session 12 — M9 Closeout: LibSQL Persistence + IDs/Routing

**Date**: 2026-05-30
**Module**: M9 — Harness loop end-to-end *(closed)*
**Duration**: ~1 session

## What shipped

### LibSQL persistence (the last literal M9 requirement)

- Added `@mastra/libsql@^1.11.1`.
- `src/harness/storage.ts` — env-driven `LibSQLStore` factory.
  - Default: `file:./.data/vibeframes.db`
  - `:memory:` for tests / ephemeral demos
  - `libsql://<turso>.io` + `VIBEFRAMES_DB_AUTH_TOKEN` for serverless
  - `mkdirSync` the parent dir on boot so a fresh clone with no `.data/` works.
- Wired the factory into `src/harness/index.ts`. Dropped the old `MastraCompositeStore` + `InMemoryStore` combo.

### Composition store made durable

- `src/harness/composition-store.ts` — file-backed Composition cache.
  - **Hydrate on first read** from `.data/compositions/<projectId>.json`.
  - **Write-through on `setComposition`** (fire-and-forget `fs.writeFile`).
  - Pluggable via `VIBEFRAMES_DATA_DIR` and `VIBEFRAMES_PERSISTENCE=memory|disk`.
  - `__resetCompositionStoreForTests` helper.
- `src/harness/store.ts` is now a back-compat re-export so tool imports keep working.

### Zero-config local run

- `.env.example` — only `OPENAI_API_KEY` is required. Every other knob documented with defaults.
- README Quick Start rewritten: clone → set key → `pnpm dev`. Refresh → timeline survives. Swap `VIBEFRAMES_DB_URL` to Turso for serverless.
- M9 marked ✅ in the roadmap block.

### Tests

- `src/harness/__tests__/composition-store.test.ts` — 4 new tests:
  - empty on first read
  - write-through to disk
  - **rehydrates after `vi.resetModules()`** (simulated process restart — proves the persistence claim)
  - `VIBEFRAMES_PERSISTENCE=memory` bypasses disk
- `pnpm typecheck` clean. `pnpm test` → **15 files, 67 tests passing**.

### Other UX fixes shipped this session

These came up before the LibSQL work and landed in the same session:

1. **Single status indicator in `ActivityItem`** — removed the redundant green dot + tick combo. Now one `StatusBadge` (spinner / check / X) in the rail, shimmer-gradient verb in the body while a tool is running.
2. **Ephemeral-status debounce** — phrases now hold for ≥ 700 ms before swapping so rapid `thinking → calling-tool → thinking` bursts don't flash.
3. **Follow-ups stop overlapping** — strengthened the Director prompt with explicit "follow-up rules" (always `get-composition` first, never reuse `startMs: 0`, reuse existing track ids). Added defence in `add-clip`: if requested `startMs` would overlap, auto-snap to the track's end and return `startAdjusted: true` + a `note` so the agent self-corrects.
4. **Enriched `get-composition`** — now returns per-track `trackEndMs`, per-clip `endMs`, and a top-level `timelineEndMs` so the agent can reason about where to append without re-deriving it.

### Docs

- `docs/lld/lld-03-harness-wiring.md` — added the **Persistence** section: ASCII diagram of the two stores (LibSQL for chat artefacts, file-backed JSON for compositions), env table, rationale for keeping the composition out of Mastra state, test inventory.
- `docs/meta/linkedin-post-02-harness-loop.md` — two drafts of LinkedIn post #2 ("Smallest possible Mastra Harness loop, end-to-end"), asset checklist, comment seed.

## How `projectId` and `threadId` are tracked (current reality)

Came up at the very end of the session. Quick reference for M11.

### `projectId`

- **Source**: hardcoded `PROJECT_ID = "default"` in `src/app/studio/page.tsx:13`. No URL param, no list, no picker.
- **Wire**: sent in every chat request body as `data.projectId` (`use-harness-chat.ts:68`).
- **Server uses it as**:
  - Key into the per-process `instances: Map<string, Harness>` cache.
  - `resourceId` on the Mastra `Harness` — this is the FK that links rows in LibSQL `threads` back to a project.
  - Filename for composition snapshots: `.data/compositions/<projectId>.json`.
  - Argument on every tool so mutations land on the right composition.

### `threadId`

- **Never surfaces in the UI.** `route.ts` calls `harness.selectOrCreateThread()` and never reads back what id Mastra picked.
- **Mastra behaviour**: select the most recent thread for `resourceId = "default"`; if none, mint one and `INSERT INTO threads`.
- **Result**: one active project, one auto-selected thread per project. Refresh resumes the same thread (that's what M9 wanted). There's no UI affordance to switch threads or start a new chat.

### What's missing → M11

| Concern | Today | M11 plan |
|---|---|---|
| `projectId` source | hardcoded `"default"` | URL slug → `/studio/[projectId]`, Prisma `Project` row |
| Multiple projects | not possible | sidebar list, "+ New Project" |
| `threadId` selection | latest-only (auto) | thread sidebar, `?thread=…` query param |
| "New chat" button | none | `harness.createThread()` + navigate |
| Cross-user isolation | none | Clerk org → `resourceId = "${orgId}:${projectId}"` |
| Composition ↔ project | file keyed on `projectId` | Prisma `Composition.projectId` FK |

Concrete M11 refactor sketch:

```ts
// Route: /studio/[projectId]/[[...threadId]]/page.tsx
const harness = await getVibeFramesHarness(orgId, projectId);
await harness.selectThread(threadId);          // explicit, not auto
// Emit `thread.created` SSE event when a new one is minted so the
// client can navigate to its URL.
```

## M9 ledger

| Plan item | Status |
|---|---|
| Mastra installed | ✅ |
| `@mastra/libsql` storage | ✅ *(was the only literal gap)* |
| Harness instance cache per `projectId` | ✅ |
| One mode + agent + system prompt | ✅ |
| Real tools (replaced placeholders) | ✅ exceeded |
| SSE `/api/chat` | ✅ |
| Chat UI w/ tool cards | ✅ exceeded (timeline + ephemeral status) |
| Refresh persists | ✅ |
| `lld-03-harness-wiring.md` | ✅ + persistence section |
| `lld-04-sse-protocol.md` | ✅ |
| LinkedIn post #2 draft | ✅ |

**M9 closed.**

## Next session

M10 kickoff — choice between:
- **M10a** Block registry (Zod-schema'd HyperFrames blocks), OR
- **M10b** Editor 4-pane shell (resizable: AssetLib · Preview · Timeline · Properties), OR
- **M10c** Timeline lib decision → ADR-005 (`@xzdarcy/react-timeline-editor` vs custom dnd-kit).

## File map this session

```
src/harness/
  storage.ts                            NEW — LibSQL factory
  composition-store.ts                  NEW — disk-backed cache
  store.ts                              shrunk to back-compat re-export
  index.ts                              swapped store → LibSQL
  tools/add-clip.ts                     overlap-snap defence + adjustment note
  tools/get-composition.ts              + trackEndMs / endMs / timelineEndMs
  prompts/composer.ts                   follow-up rules tightened
  __tests__/composition-store.test.ts   NEW — 4 persistence tests

src/components/studio/
  chat-message.tsx                      single StatusBadge in rail
  ephemeral-status.tsx                  700 ms min-hold debounce

.env.example                            NEW — zero-config template
README.md                               M9 ✅, Quick Start rewrite, Turso recipe
docs/lld/lld-03-harness-wiring.md       + Persistence section
docs/meta/linkedin-post-02-harness-loop.md   NEW — two drafts + checklist
```
