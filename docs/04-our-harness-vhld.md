# Our Harness — Very High-Level Design

> **TL;DR** — VibeFrames wraps a single `Harness<VibeState>` per project. Two modes (`plan` for thinking/proposing, `vibe` for executing), two agents (Planner + Composer), one model (`o4-mini` at different reasoning efforts), four skill domains, three tool categories, thread-scoped message history (LibSQL), and a 9-event SSE contract. This doc is the *shape* — the anatomy diagram with five bullets per box. Detailed schemas, tool signatures, and SSE protocol come in M5.

---

## 0. How Mastra constructs connect

Before diving into VibeFrames' specific shape, here's how Mastra's building blocks stack together — from the LLM at the bottom to the Harness at the top:

```
  HOW MASTRA CONSTRUCTS CONNECT
  ═════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │                         ╔═══════════════╗                           │
  │                         ║   HARNESS     ║  ← long-lived container   │
  │                         ║               ║    per project            │
  │                         ╚═══════╤═══════╝                           │
  │                                 │                                   │
  │                   ┌─────────────┼─────────────┐                     │
  │                   │             │             │                     │
  │                   ▼             ▼             ▼                     │
  │            ╔════════════╗ ╔══════════╗ ╔════════════╗               │
  │            ║   MODES    ║ ║  STATE   ║ ║  MEMORY    ║               │
  │            ║            ║ ║  (Zod)   ║ ║  + STORAGE ║               │
  │            ╚═════╤══════╝ ╚══════════╝ ╚════════════╝               │
  │                  │                                                  │
  │         ┌────────┴────────┐                                         │
  │         │                 │                                         │
  │         ▼                 ▼                                         │
  │  ╔════════════╗    ╔════════════╗                                   │
  │  ║ MODE:plan  ║    ║ MODE:vibe  ║   ← swap agent behavior          │
  │  ║            ║    ║            ║     without rebuilding             │
  │  ╚═════╤══════╝    ╚═════╤══════╝                                   │
  │        │                 │                                          │
  │        ▼                 ▼                                          │
  │  ╔════════════╗    ╔════════════╗                                   │
  │  ║   AGENT    ║    ║   AGENT    ║   ← wraps model + instructions    │
  │  ║  Planner   ║    ║  Composer  ║     + tools                       │
  │  ╚═════╤══════╝    ╚═════╤══════╝                                   │
  │        │                 │                                          │
  │        │     ┌───────────┤                                          │
  │        │     │           │                                          │
  │        ▼     ▼           ▼                                          │
  │  ╔══════════╗     ╔════════════╗                                    │
  │  ║  TOOLS   ║     ║   SKILLS   ║   ← tools = actions               │
  │  ║ (Zod in/ ║     ║  (loaded   ║     skills = knowledge             │
  │  ║  out)    ║     ║   on       ║                                    │
  │  ╚════╤═════╝     ║   demand)  ║                                    │
  │       │           ╚════════════╝                                    │
  │       ▼                                                             │
  │  ╔══════════════════════╗                                           │
  │  ║    AI SDK CORE       ║   ← unified LLM interface                 │
  │  ║  generateText()      ║     (provider-agnostic)                   │
  │  ║  streamText()        ║                                           │
  │  ╚══════════╤═══════════╝                                           │
  │             │                                                       │
  │             ▼                                                       │
  │  ╔══════════════════════╗                                           │
  │  ║    LLM PROVIDER      ║   ← OpenAI o4-mini                       │
  │  ║  @ai-sdk/openai      ║     (swappable to any provider)           │
  │  ╚══════════════════════╝                                           │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

### How a user message flows through these layers

```
  USER MESSAGE FLOW
  ═════════════════

  ┌──────────┐
  │  "add a  │
  │  title   │
  │  slide"  │
  └────┬─────┘
       │
       │  POST /api/chat
       ▼
  ╔══════════╗
  ║ HARNESS  ║──── setState({ selection })     ← inject per-request data
  ╚════╤═════╝
       │
       │  route to active mode
       ▼
  ╔══════════╗
  ║  MODE    ║──── which agent handles this?   ← plan or vibe
  ╚════╤═════╝
       │
       │  call agent with message + state
       ▼
  ╔══════════╗
  ║  AGENT   ║──── instructions(state) builds  ← dynamic system prompt
  ║          ║     the system prompt
  ╚════╤═════╝
       │
       │  LLM reasons, decides tool calls
       ▼
  ╔══════════╗     ╔══════════╗
  ║  TOOLS   ║────►║  STATE   ║                ← tools read & write state
  ║ execute()║     ║ setState ║
  ╚════╤═════╝     ╚══════════╝
       │
       │  tool results feed back to agent
       ▼
  ╔══════════╗
  ║  AGENT   ║──── generates final response    ← text tokens streamed
  ╚════╤═════╝
       │
       │  events emitted
       ▼
  ╔══════════╗
  ║  EVENT   ║──── agent.thinking               ← SSE to client
  ║   BUS    ║     tool.calling
  ║          ║     composition.delta
  ║          ║     agent.responding
  ║          ║     run.complete
  ╚══════════╝
```

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
│  ┌─────────────────────────────────┐┌───────────────────────────┐ │
│  │   MODE: "plan" (default)        ││   MODE: "vibe"             │ │
│  │                                 ││                           │ │
│  │   Agent: Planner                ││   Agent: Composer          │ │
│  │   Model: o4-mini (low effort)   ││   Model: o4-mini (medium)  │ │
│  │   instructions: buildPlan-      ││   instructions: buildVibe- │ │
│  │     nerPrompt(state)            ││     Prompt(state)          │ │
│  │   tools: contextTools ONLY      ││   tools: ALL tools         │ │
│  │                                 ││                           │ │
│  │   PURPOSE: think, propose plan  ││   PURPOSE: execute plan    │ │
│  │   OUTPUT: structured plan card  ││   OUTPUT: composition      │ │
│  │     (user approves → vibe)      ││     mutations + response   │ │
│  └─────────────────────────────────┘└───────────────────────────┘ │
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

## 2. Modes — Plan + Vibe

Two modes. Two agents. One model (different reasoning efforts).

### Why two modes?

```
  THE PROBLEM WITH A SINGLE MODE
  ══════════════════════════════

  User: "create a 30-second product video"
         │
         ▼
  ╔════════════════════════════════════════╗
  ║  Single-mode agent                    ║
  ║                                       ║
  ║  Immediately starts calling tools:    ║
  ║    add-clip(bg)                       ║
  ║    add-clip(title)                    ║
  ║    add-clip(product-shot)             ║   ← no chance to review!
  ║    add-clip(cta)                      ║
  ║    add-clip(music)                    ║
  ║                                       ║
  ║  User sees 5 mutations fly by...      ║
  ║  "Wait, I wanted it different!"       ║
  ╚════════════════════════════════════════╝


  THE TWO-MODE SOLUTION
  ═════════════════════

  User: "create a 30-second product video"
         │
         ▼
  ╔═══════════════════════════════════════════════════════╗
  ║  PLAN mode                                           ║
  ║                                                      ║
  ║  Agent proposes (no mutations):                      ║
  ║                                                      ║
  ║  ┌────────────────────────────────────────────────┐   ║
  ║  │  📋 Plan                                       │   ║
  ║  │                                                │   ║
  ║  │  1. Background gradient (0–30s, track 0)       │   ║
  ║  │  2. Product hero image (0–10s, track 1)        │   ║
  ║  │  3. Title "New Product" (2–8s, track 2)        │   ║
  ║  │  4. Features list (10–22s, track 1)            │   ║
  ║  │  5. CTA + logo (22–30s, track 1)               │   ║
  ║  │  6. Background music (0–30s, track 3)          │   ║
  ║  │                                                │   ║
  ║  │  Total: 30s, 4 tracks, 6 clips                │   ║
  ║  │                                                │   ║
  ║  │         [ ✓ Execute ]  [ ✎ Revise ]            │   ║
  ║  └────────────────────────────────────────────────┘   ║
  ╚═══════════════════════════════════════════════════════╝
         │
         │  User clicks "Execute" (or says "looks good")
         ▼
  ╔═══════════════════════════════════════════════════════╗
  ║  VIBE mode                                           ║
  ║                                                      ║
  ║  Agent executes the approved plan:                   ║
  ║    add-clip(bg-gradient, 0, 30, track 0)    → ✓      ║
  ║    add-clip(product-hero, 0, 10, track 1)   → ✓      ║
  ║    add-clip(title, 2, 6, track 2)           → ✓      ║
  ║    add-clip(features, 10, 12, track 1)      → ✓      ║
  ║    add-clip(cta-logo, 22, 8, track 1)       → ✓      ║
  ║    add-clip(music, 0, 30, track 3)          → ✓      ║
  ║    validate-composition()                   → ✓      ║
  ║                                                      ║
  ║  "Done — 6 clips created across 4 tracks."          ║
  ╚═══════════════════════════════════════════════════════╝
```

### Mode definitions

| | Plan mode | Vibe mode |
|---|-----------|----------|
| **ID** | `plan` | `vibe` |
| **Default** | ✓ (first mode for new requests) | activated after plan approval |
| **Agent** | Planner | Composer |
| **Model** | `openai/o4-mini` | `openai/o4-mini` |
| **Reasoning effort** | `low` (fast, cheap) | `medium` (thorough) |
| **Tools** | Context only (read-only) | All tools (context + mutation + validation) |
| **Output** | Structured plan card | Composition mutations + text |
| **Purpose** | Think, propose, get approval | Execute approved plan |

### When to skip Plan mode

Not every message needs a plan. Simple edits go directly to Vibe:

```
  ┌──────────────────────────────────────────────────┐
  │  ROUTING LOGIC (in route handler)                 │
  │                                                   │
  │  if (message is simple edit                       │
  │      AND composition exists                       │
  │      AND selection is present):                   │
  │                                                   │
  │    → straight to VIBE mode                        │
  │    e.g. "make this clip 2s longer"                │
  │         "change the title text"                   │
  │         "remove this clip"                        │
  │                                                   │
  │  else (complex / generative):                     │
  │                                                   │
  │    → PLAN mode first                              │
  │    e.g. "create a product video"                  │
  │         "add an intro sequence"                   │
  │         "restructure the timeline"                │
  └──────────────────────────────────────────────────┘
```

For MVP, the routing is simple: if the user's message looks like a direct edit on a selected clip, skip planning. Otherwise, plan first. The agent can also self-route by calling a `propose-plan` tool in Vibe mode that pauses for approval.

### Shape (not final code)

```ts
const planMode = {
  id: 'plan',
  name: 'Plan',
  default: true,
  agent: new Agent({
    id: 'vibeframes-planner',
    name: 'Planner',
    model: 'openai/o4-mini',
    instructions: ({ requestContext }) => {
      const state = requestContext.get('harness').state;
      return buildPlannerPrompt(state);
    },
    tools: { ...contextTools },  // read-only — no mutations
  }),
};

const vibeMode = {
  id: 'vibe',
  name: 'Vibe',
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

### What each prompt injects

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  PLANNER PROMPT                     │  COMPOSER PROMPT           │
  │  buildPlannerPrompt(state)          │  buildComposerPrompt(state)│
  ├─────────────────────────────────────┼────────────────────────────┤
  │                                     │                            │
  │  1. Identity: "You are Planner.     │  1. Identity: "You are     │
  │     You propose changes, never      │     Composer. You execute  │
  │     execute them."                  │     using tools."          │
  │                                     │                            │
  │  2. Project context                 │  2. Project context        │
  │     (state.projectMeta)             │     (state.projectMeta)    │
  │                                     │                            │
  │  3. Composition summary             │  3. Composition summary    │
  │     (clip count, duration, tracks)  │     (full detail)          │
  │                                     │                            │
  │  4. Selection context               │  4. Selection context      │
  │                                     │                            │
  │  5. Output format: structured       │  5. Approved plan          │
  │     plan card with numbered steps   │     (if coming from plan)  │
  │                                     │                            │
  │  6. "NEVER call mutation tools.     │  6. "Validate after every  │
  │     Only propose."                  │     mutation batch."       │
  │                                     │                            │
  └─────────────────────────────────────┴────────────────────────────┘
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

Eight event types streamed from harness to client:

| Event | Payload shape | UI response |
|-------|---------------|-------------|
| `agent.thinking` | `{ reasoningSummary? }` | Show thinking indicator / collapsible reasoning |
| `agent.responding` | `{ text }` | Append to chat message bubble (streaming) |
| `plan.proposed` | `{ steps[], summary }` | Show plan card with Execute / Revise buttons |
| `tool.calling` | `{ toolName, args }` | Show tool card in chat ("Adding clip...") |
| `tool.result` | `{ toolName, result, success }` | Update tool card (✓ or ✗) |
| `composition.delta` | `{ op, path, value }` | Update preview player + timeline UI in real-time |
| `run.complete` | `{ message, usage }` | Finalize chat message, show token count |
| `run.error` | `{ error, code }` | Show error toast / inline error |

### Event flow: Plan → Execute

```
  PLAN MODE TURN (complex request)
  ════════════════════════════════

  User: "create a 30-second product video"
    │
    ├── agent.thinking        { reasoningSummary: "Analyzing request..." }
    ├── tool.calling          { toolName: "search-blocks", args: { intent: "product" } }
    ├── tool.result           { toolName: "search-blocks", success: true }
    ├── agent.responding      { text: "Here's my plan:" }
    ├── plan.proposed         { steps: [...6 clips], summary: "30s, 4 tracks" }
    └── run.complete          { message: "Here's my plan:...", usage: {...} }

  User clicks [ ✓ Execute ]  →  harness switches to Vibe mode

  VIBE MODE TURN (executing approved plan)
  ════════════════════════════════════════

    ├── agent.thinking        { }
    ├── tool.calling          { toolName: "add-clip", args: { type: "element", ... } }
    ├── composition.delta     { op: "add", path: "/clips/-", value: {...} }
    ├── tool.result           { toolName: "add-clip", success: true }
    ├──  ... (4 more add-clip calls)
    ├── tool.calling          { toolName: "validate-composition", args: {} }
    ├── tool.result           { toolName: "validate-composition", success: true }
    ├── agent.responding      { text: "Done — 6 clips across 4 tracks." }
    └── run.complete          { message: "Done — ...", usage: {...} }
```

### Event flow: Direct edit (skips Plan)

```
  User: "make the title clip 2 seconds longer"  [selection: title-1]
    │
    ├── agent.thinking        { }
    ├── tool.calling          { toolName: "get-composition", args: {} }
    ├── tool.result           { toolName: "get-composition", success: true }
    ├── tool.calling          { toolName: "update-clip", args: { clipId: "title-1", duration: 6 } }
    ├── composition.delta     { op: "replace", path: "/clips/title-1/duration", value: 6 }
    ├── tool.result           { toolName: "update-clip", success: true }
    ├── tool.calling          { toolName: "validate-composition", args: {} }
    ├── tool.result           { toolName: "validate-composition", success: true }
    ├── agent.responding      { text: "Done — the title clip is now 6 seconds." }
    └── run.complete          { message: "Done — ...", usage: {...} }
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
  │     modes: [planMode, vibeMode],
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
