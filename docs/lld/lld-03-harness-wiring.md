# LLD-03 · Mastra Harness Wiring

Status: Implemented (M9)
Owner: VibeFrames
Last updated: 2026-05-30

## Why a Harness, not `streamText`

We initially wired chat through AI SDK's `streamText`. That's an LLM call wrapper. A Mastra **Harness** is the actual agent runtime — it owns threads, memory, modes, tools, skills, an event bus, and a permission system. The same primitives Joshua Liu's `mc-studio-services` uses to drive HeyGen Studio.

```
┌─────────────────────────────────────────────────────────────┐
│                       VibeFrames Harness                    │
│  id: "vibeframes" · resourceId: <projectId>                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ State  (Zod-validated)                               │   │
│  │   projectId, currentRunId, yolo                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Modes — only one for now: "director"                 │   │
│  │   Agent: gpt-4o-mini                                 │   │
│  │   Instructions: buildDirectorPrompt()                │   │
│  │   Tools: add-clip, update-clip, remove-clip,         │   │
│  │          get-composition, get-block-schemas          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Memory (MastraMemory) → MastraCompositeStore         │   │
│  │   threads · messages · per-thread state              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Workspace.skills = [ src/harness/skills ]            │   │
│  │   hyperframes/skill.md → HTML/CSS guidance           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## File layout

```
src/harness/
  index.ts          createVibeFramesHarness, getVibeFramesHarness (cached)
  state.ts          VibeFramesStateSchema + createInitialState (yolo:true)
  mode.ts           createDirectorMode → HarnessMode<VibeFramesState>
  prompts/
    composer.ts     buildDirectorPrompt()
    index.ts        barrel
  services/
    types.ts        HarnessServices, ClipRegistryService, HyperFramesBlock
    clip-registry.service.ts  in-memory Tailwind block catalog
    index.ts        createHarnessServices()
  tools/
    add-clip.ts             createAddClipTool()
    update-clip.ts          createUpdateClipTool()
    remove-clip.ts          createRemoveClipTool()
    get-composition.ts      createGetCompositionTool()
    get-block-schemas.ts    createGetBlockSchemasTool(services)
    index.ts                createHarnessTools(services)
  skills/
    hyperframes/skill.md    YAML-frontmatter skill loaded by Mastra Workspace
  mutations.ts      addClip/updateClip/removeClip (pure)
  serialize.ts      Composition → HyperFrames HTML
  storage.ts        env-driven LibSQL factory (file:// default, Turso optional)
  composition-store.ts  disk-backed Composition cache (hydrate-on-read, write-through)
  store.ts          back-compat re-export of composition-store
  use-harness-chat.ts   React hook — SSE consumer
  use-composition.ts    React hook — extract HTML/clipCount/trackCount from tool results
```

## Boot sequence

`getVibeFramesHarness(projectId)`:

1. `instances.get(projectId)` → return if cached.
2. `createVibeFramesHarness(projectId)`:
   - `const storage = createHarnessStorage()` → `LibSQLStore({ url: env.VIBEFRAMES_DB_URL ?? "file:./.data/vibeframes.db", authToken? })`
   - `new Memory({ storage })`
   - `new Harness<VibeFramesState>({ id:"vibeframes", resourceId, stateSchema, storage, memory, modes:[directorMode], workspace:{ skills:[SKILLS_PATH] }, disableBuiltinTools:["task_write","task_check","ask_user","submit_plan"] })`
3. `await harness.init()` — hydrates the active thread/messages from storage (LibSQL on disk).
4. `await harness.setState(createInitialState(projectId, true))` — sets `yolo:true` so all tool calls auto-approve.
5. Cache and return.

The per-projectId `instances` Map is the *in-process* cache. The real durability
layer is LibSQL + the disk-backed composition store — see Persistence below.

## YOLO mode — why and how

Mastra's harness defaults to `policy: "ask"` on the `other` tool category, which emits `tool_approval_required` and **suspends** the run until the UI calls `harness.respondToToolApproval({ decision:"approve" })`. That's a stateful, human-in-the-loop flow.

VibeFrames lives in Vercel serverless. A Vercel function cannot pause for human input — once the response stream closes, there is no resumable runtime. So we set `state.yolo = true`, which is mc-studio-services' convention for "skip the gate". Tool execution proceeds inline.

If we ever move to durable workflows (Temporal, Inngest), we can flip yolo to false and emit `tool_approval_required` to the UI.

## Per-request dance — `/api/chat`

```
POST /api/chat  ─┬─►  getVibeFramesHarness(projectId)
                 │
                 ├─►  await harness.selectOrCreateThread()
                 │
                 ├─►  open SSE stream, subscribe to harness events
                 │
                 ├─►  await harness.sendMessage({ content })
                 │      │
                 │      └► Mastra Agent loop:
                 │         text_delta → tool_start → execute(tool) → tool_end → text_delta → message_end
                 │
                 └─►  unsubscribe + close stream
```

Subscriber filters out high-frequency display events (`display_state_changed`, `tool_input_delta`, `tool_input_*`) and re-emits the rest in a `VibeFramesEvent` envelope (see LLD-04).

## Tools

Each tool is built with `createTool` from `@mastra/core/tools` and wrapped in a factory so the harness can inject services:

```ts
export function createAddClipTool() {
  return createTool({
    id: "add-clip",
    description: "...",
    inputSchema: z.object({ projectId, trackId, html, startMs, durationMs, ... }),
    execute: async (args) => {
      const composition = getComposition(args.projectId);
      const updated = addClip(composition, { ...args });
      setComposition(args.projectId, updated);
      return { clipId, compositionHtml: serialize(updated), clipCount, trackCount };
    },
  });
}
```

`compositionHtml` in every tool result is what the UI uses to drive the iframe.

## Services & Block Registry

`HarnessServices` is the dependency surface our tools close over. Today it has one service:

- **`clipRegistry`** — returns a list of pre-designed HyperFrames blocks (hero title, lower-third, split-screen) as Tailwind HTML templates. The `get-block-schemas` tool exposes this to the agent.

Future services live here: asset library, font registry, music library, brand-kit lookup.

## Skills

Mastra Workspace ingests `**/skill.md` files. Each must have YAML frontmatter:

```yaml
---
name: hyperframes
description: Core knowledge for building HTML/CSS clips in HyperFrames
---
```

Today: 5 focused skill files under `src/harness/skills/` — `hyperframes/` (universal foundation), `blocks/` (scene-building registry), `social-overlays/` (TikTok / IG / X UI), `effects/` (cosmetic textures), `transitions/` (clip-to-clip). Tomorrow: `captions/skill.md`, `gsap/skill.md`, `lottie/skill.md`. The agent gets a built-in `skill` tool to load these on demand.

## Persistence — zero-config + pluggable

VibeFrames runs locally with just `OPENAI_API_KEY`. Everything else has a
working default that survives a process restart.

```
         OPENAI_API_KEY=...                      ENV (only required)
              │
              ▼
  ┌─────────────────────────────────────┐
  │        VibeFrames Harness               │
  │                                         │
  │   ┌──────────────────────────────┐   │
  │   │  threads + messages       │   │
  │   │  (Mastra Memory)          │───┼──────┐
  │   └──────────────────────────────┘   │     │
  │                                         │     ▼
  │   ┌──────────────────────────────┐   │   LibSQL
  │   │  per-project Composition  │───┼─────────────┐
  │   │  (composition-store.ts)   │   │  file:./.data/   │
  │   └──────────────────────────────┘   │  vibeframes.db   │
  └─────────────────────────────────────┘                  │
              │                                              │
              └─ → JSON files in .data/compositions/*.json  ─┘
```

### Mastra side — threads + messages

`src/harness/storage.ts` builds a `LibSQLStore` whose URL is env-driven:

| `VIBEFRAMES_DB_URL`                  | Behaviour                                |
| ------------------------------------ | ---------------------------------------- |
| (unset)                              | `file:./.data/vibeframes.db` (default)    |
| `file:./path/to.db`                  | local SQLite file at that path           |
| `:memory:`                           | ephemeral, lost on restart (tests/demos) |
| `libsql://...turso.io` + auth token  | Turso — use for serverless deployments  |

A local file is created on first boot — the factory `mkdirSync`s the parent
directory so a fresh clone with no `.data/` works without manual setup.

### Composition side — the actual video tree

Mastra's storage holds chat artefacts; our `Composition` (tracks, clips, HTML)
lives outside it. `composition-store.ts` is a tiny adapter:

- **Hydrate on first read.** First `getComposition(projectId)` after boot looks
  for `.data/compositions/<projectId>.json` and restores it. Misses fall back
  to `createEmptyComposition`.
- **Write-through on mutation.** `setComposition` updates the in-memory Map and
  fires `fs.writeFile` (fire-and-forget). The Map remains the source of truth
  *within* a process; disk is for *across* processes.
- **Pluggable.** Two env knobs:
  - `VIBEFRAMES_DATA_DIR` — where snapshots are written.
  - `VIBEFRAMES_PERSISTENCE=memory` — disables disk (tests, ephemeral demos).

Why not store the composition inside the Mastra harness state? Two reasons:

1. Tools are sync-flavoured at the call site; threading async `getState()` into
   every tool would invert their control flow. A simple per-pid Map gives us
   the same UX with less coupling.
2. Compositions are large blobs (full HTML); keeping them out of Mastra's
   state-snapshot path avoids growing every thread row.

### Tests

See `src/harness/__tests__/composition-store.test.ts`:
- empty on first read
- write-through to disk
- rehydrate after `vi.resetModules()` (simulated process restart)
- `VIBEFRAMES_PERSISTENCE=memory` bypasses disk

## Future work

- **Director vs Editor modes** — add a second mode for fine-grained edits ("nudge clip 2 left by 200ms").
- **Asset registry service** — Unsplash/Pexels image search.
- **Composition deltas in LibSQL** — move `composition-store` writes into a
  Mastra-managed table for transactional consistency with thread state.
- **Approval flow** — when we move to durable workflows, expose `tool_approval_required` to the UI for destructive ops.
