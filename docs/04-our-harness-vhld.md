# Our Harness — Very High-Level Design

> **TL;DR** — VibeFrames wraps a single `Harness<VibeState>` per project. One mode (`vibe`), one agent (`Composer`), one model (`o4-mini`), four skill domains, three tool categories, thread-scoped message history (LibSQL), and a 7-event SSE contract. This doc is the *shape* — the anatomy diagram with five bullets per box. Detailed schemas, tool signatures, and SSE protocol come in M5.

---

## The big picture

```
┌──────────────────────────────────────────────────────────────────┐
│               VibeFrames Harness (per project)                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │      STATE       │  │     STORAGE      │  │     MEMORY     │  │
│  │                  │  │                  │  │                │  │
│  │  projectId       │  │  LibSQLStore     │  │  lastMessages  │  │
│  │  composition     │  │  (file:local.db) │  │  : 20          │  │
│  │  selection       │  │                  │  │                │  │
│  │  projectMeta     │  │  threads         │  │  OM: deferred  │  │
│  │  renderStatus    │  │  messages        │  │                │  │
│  └──────────────────┘  │  state snapshots │  │  semantic:     │  │
│                         └──────────────────┘  │  deferred      │  │
│                                                └────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   MODE: "vibe" (default, only)               │ │
│  │                                                              │ │
│  │   Agent: Composer                                            │ │
│  │   Model: openai/o4-mini                                      │ │
│  │   instructions: buildComposerPrompt(state)  ← dynamic       │ │
│  │   tools: contextTools + mutationTools + validationTools       │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐ │
│  │       WORKSPACE          │  │          EVENT BUS             │ │
│  │                          │  │                                │ │
│  │   skills/                │  │  agent.thinking                │ │
│  │   ├── hyperframes/       │  │  agent.responding              │ │
│  │   ├── composition/       │  │  tool.calling                  │ │
│  │   ├── captions/          │  │  tool.result                   │ │
│  │   └── audio/             │  │  composition.delta             │ │
│  │                          │  │  run.complete                  │ │
│  │   + Mastra built-ins:    │  │  run.error                    │ │
│  │   skill() skill_search() │  │                                │ │
│  │   skill_read()           │  │                                │ │
│  └──────────────────────────┘  └────────────────────────────────┘ │
│                                                                   │
│  id: "vibeframes"                                                 │
│  resourceId: projectId                                            │
│  stateSchema: VibeStateSchema (Zod)                               │
│  disableBuiltinTools: [task_write, task_check, submit_plan]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. State — `VibeStateSchema`

Per-thread, Zod-validated. Categorized by lifecycle.

### Hydrated once (on harness creation)

- **`projectId`** — resource key; scopes all tool operations
- **`projectMeta`** — project name, description, aspect ratio, fps, default duration
- **`composition`** — the canonical JSON tree representing the current video (clips, tracks, timing, assets)
- **`blockCatalog`** — cached list of available HyperFrames blocks (from `npx hyperframes catalog`)

### Refreshed per request

- **`selection`** — what the user has selected in the timeline/preview UI (clipId, trackIndex, intent: edit | delete | replace)

### Mutated by tools

- **`composition`** — tools update the tree via add-clip, update-clip, remove-clip, reorder
- **`renderStatus`** — current preview state (idle, rendering, ready, error)

### Init-only flags

- **`yolo`** — `true` for MVP: tools auto-execute without approval prompts

```
┌─────────────────────────────────────┐
│           VibeState                 │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  HYDRATED ONCE                ║  │
│  ║  • projectId                  ║  │
│  ║  • projectMeta                ║  │
│  ║  • composition (initial)      ║  │
│  ║  • blockCatalog               ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  REFRESHED PER REQUEST        ║  │
│  ║  • selection                  ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  MUTATED BY TOOLS             ║  │
│  ║  • composition (updated)      ║  │
│  ║  • renderStatus               ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  INIT FLAGS                   ║  │
│  ║  • yolo = true                ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

## 2. Mode — Composer (`vibe`)

Single mode. Single agent. Single model.

- **Mode ID**: `vibe` (default, only)
- **Agent name**: Composer
- **Model**: `openai/o4-mini` with `reasoningEffort: 'medium'` default, escalated to `'high'` for complex composition tasks
- **Instructions**: dynamic function — `buildComposerPrompt(state)` — injects project meta, current composition summary, selection context, and available tools per turn
- **Future modes** (not MVP): `plan` (structured planning before composing), `build` (code-level composition editing)

```ts
// Shape only — not final code
const vibeMode = {
  id: 'vibe',
  name: 'Vibe',
  default: true,
  agent: new Agent({
    id: 'vibeframes-composer',
    name: 'Composer',
    model: 'openai/o4-mini',
    instructions: ({ requestContext }) => {
      const state = requestContext.get('harness').state;
      return buildComposerPrompt(state);
    },
    tools: { ...contextTools, ...mutationTools, ...validationTools },
  }),
};
```

### What `buildComposerPrompt(state)` injects

```
┌──────────────────────────────────────────────┐
│  System prompt (rebuilt each turn)            │
│                                              │
│  1. Identity & role description              │
│  2. Project context from state.projectMeta   │
│  3. Composition summary:                     │
│     - clip count, total duration, track map  │
│     - or "no composition yet"                │
│  4. Selection context:                       │
│     - "user selected clip X (intent: edit)"  │
│     - or "no active selection"               │
│  5. Available skills (metadata only)         │
│  6. Rules & constraints                      │
│     - always validate after mutations        │
│     - use structured tools, not raw HTML     │
│     - respect HyperFrames data attributes    │
└──────────────────────────────────────────────┘
```

---

## 3. Skills — deferred domain knowledge

Four skill domains, loaded on demand by the agent:

| Skill | What it teaches | When loaded |
|-------|-----------------|-------------|
| **`hyperframes`** | Composition rules, data attributes (`data-start`, `data-duration`, `data-track-index`), clip types, nested compositions, GSAP timeline registration | Agent needs to author or validate composition structure |
| **`composition`** | JSON tree mutations — add/update/remove clip, reorder tracks, set metadata. Serialization to/from HyperFrames HTML | Agent needs to understand the canonical data model |
| **`captions`** | Word-level timing from transcripts, pill-karaoke component, caption track placement | User asks for captions or subtitles |
| **`audio`** | Volume levels, track layering, fade in/out, background music placement, audio clip trimming | User asks to add/edit audio or music |

### How it flows

```
User: "add captions to the intro clip"
  │
  ▼
Agent system prompt shows:
  Skills available: hyperframes, composition, captions, audio
  (names + one-line descriptions only)
  │
  ▼
Agent calls: skill({ name: "captions" })
  │
  ▼
Mastra returns SKILL.md body (~3 KB)
  │
  ▼
Agent now knows caption rules:
  - word-level timing from transcript.json
  - pill-karaoke block from catalog
  - caption track on trackIndex = highest + 1
  │
  ▼
Agent calls: add-clip({ type: "caption", ... })
```

---

## 4. Tools — three categories

Tools are the bridge between agent reasoning and composition state. Organized by intent:

### Context tools — read-only queries

| Tool | Purpose |
|------|---------|
| `get-project` | Fetch project metadata (name, aspect ratio, fps, duration) |
| `get-composition` | Return the current canonical JSON tree |
| `search-blocks` | Search HyperFrames block catalog by intent |
| `get-block-schemas` | Fetch schema for specific blocks (slots, properties) |

### Mutation tools — modify the composition

| Tool | Purpose |
|------|---------|
| `add-clip` | Insert a new clip (video, image, audio, text, nested composition) |
| `update-clip` | Modify properties of an existing clip (timing, content, style) |
| `remove-clip` | Delete a clip by ID |
| `reorder` | Move clips between tracks or change z-order |
| `set-meta` | Update composition-level metadata (title, dimensions, fps) |

### Validation tools — check correctness

| Tool | Purpose |
|------|---------|
| `validate-composition` | Structural + timing validation (overlaps, orphaned tracks, missing required attributes) |

### Tool flow pattern

```
User message
  │
  ▼
Agent reasons (may call context tools first)
  │
  ▼
Agent calls mutation tool(s)
  │
  ▼
Tool mutates composition in state
Tool emits composition.delta event
  │
  ▼
Agent calls validate-composition
  │
  ├── valid → agent responds with summary
  │
  └── invalid → agent reads errors, self-corrects, re-validates
```

---

## 5. Memory strategy

### MVP (M9)

- **Message history**: `lastMessages: 20` — sufficient for multi-turn composition sessions
- **Storage**: `LibSQLStore` with `file:local.db` — survives dev server restarts
- **Threads**: one thread per project (user can create multiple)

### Post-launch

- **Observational memory**: background agent compresses old messages into observations when token count exceeds threshold (e.g., 30k tokens). Reflections consolidate observations at a higher threshold (e.g., 40k tokens). Keeps context window bounded for long sessions.
- **Working memory**: persistent structured data (user preferences, style choices, frequently used blocks)
- **Semantic recall**: vector search over past messages for "remember when I made that intro last week" style queries

### Why defer OM for MVP

- 20 messages of history is sufficient for a typical composition session (5–15 turns)
- OM requires careful tuning of observation/reflection prompts and token thresholds
- The MVP focus is proving the agent → composition → preview loop, not long-term memory

---

## 6. Events — the SSE contract

Seven event types streamed from harness to client:

| Event | Payload shape | UI response |
|-------|---------------|-------------|
| `agent.thinking` | `{ reasoningSummary? }` | Show thinking indicator / collapsible reasoning |
| `agent.responding` | `{ text }` | Append to chat message bubble (streaming) |
| `tool.calling` | `{ toolName, args }` | Show tool card in chat ("Adding clip...") |
| `tool.result` | `{ toolName, result, success }` | Update tool card (✓ or ✗) |
| `composition.delta` | `{ op, path, value }` | Update preview player + timeline UI in real-time |
| `run.complete` | `{ message, usage }` | Finalize chat message, show token count |
| `run.error` | `{ error, code }` | Show error toast / inline error |

### Event flow for a typical turn

```
User: "make the title clip 2 seconds longer"
  │
  ├── agent.thinking        { }
  ├── tool.calling          { toolName: "get-composition", args: {} }
  ├── tool.result           { toolName: "get-composition", success: true }
  ├── tool.calling          { toolName: "update-clip", args: { clipId: "title-1", duration: 6 } }
  ├── composition.delta     { op: "replace", path: "/clips/title-1/duration", value: 6 }
  ├── tool.result           { toolName: "update-clip", success: true }
  ├── tool.calling          { toolName: "validate-composition", args: {} }
  ├── tool.result           { toolName: "validate-composition", success: true }
  ├── agent.responding      { text: "Done — the title clip is now 6 seconds..." }
  └── run.complete          { message: "Done — ...", usage: { ... } }
```

---

## 7. Lifecycle mapped to VibeFrames

### Creation (first chat for a project)

```
POST /api/chat { projectId: "proj-1", prompt: "...", threadId: null }
  │
  ▼
getOrCreateHarness("proj-1")
  │
  ├── new Harness<VibeState>({
  │     id: "vibeframes",
  │     resourceId: "proj-1",
  │     stateSchema: VibeStateSchema,
  │     modes: [vibeMode],
  │     workspace: { skills: ["./skills"] },
  │     disableBuiltinTools: ["task_write", "task_check", "submit_plan"],
  │   })
  │
  ├── harness.init()
  │
  ├── harness.setState({
  │     projectId: "proj-1",
  │     composition: null,           ← empty canvas
  │     projectMeta: { name: "Untitled", width: 1920, height: 1080, fps: 30 },
  │     blockCatalog: [...],         ← cached catalog
  │     yolo: true,
  │   })
  │
  ├── cache.set("proj-1", harness)
  │
  └── READY
```

### Usage (subsequent turns)

```
POST /api/chat { projectId: "proj-1", prompt: "add a subtitle", selection: { clipId: "title-1" } }
  │
  ▼
getOrCreateHarness("proj-1")  → cache hit
  │
  ├── harness.setState({ selection: { clipId: "title-1", intent: "edit" } })
  │
  ├── harness.subscribe(event => sseStream.write(event))
  │
  ├── harness.sendMessage({ content: "add a subtitle", threadId: "thread-1" })
  │
  └── events stream to client
```

---

## 8. What this VHLD intentionally leaves out

These are **deferred to M5** (HLD) or later modules:

- **Tool Zod schemas** — exact `inputSchema` / `outputSchema` for each tool
- **Composition JSON tree spec** — the canonical data model (M5 §2)
- **SSE transport details** — wire format, reconnection, keepalive (M5 §1)
- **HTML serialization** — how JSON tree becomes HyperFrames HTML (M5 §3)
- **UI component mapping** — which React component renders which event (M7)
- **Render pipeline** — browser preview vs CLI MP4 export (M5 §4)
- **Auth and multi-tenancy** — Clerk integration (M11)
- **Observational memory config** — token thresholds, observation/reflection prompts (post-MVP)

---

## 9. What's next

- **M5** — HLD: tools, SSE, render, composition model, UI bridging — the detailed design that fills in what this VHLD sketches
- **M6** — Tech stack base — specific versions, package choices, configuration
