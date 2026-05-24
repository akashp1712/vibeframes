# Harness — Why, What, How

> **TL;DR** — A Mastra `Harness` is a long-lived runtime container for multi-turn agent conversations. It bundles four stores (state, threads, messages, observational memory), modes (swappable agent personalities), workspace (skills loaded on demand), tools, and an event bus into one class. The plain `Agent` from M2 handles single-turn reasoning; the Harness adds everything needed for a stateful, multi-turn editing session. This doc covers why it exists, what it holds (anatomy of the four stores, memory subsystem, built-in tools), and how it works (lifecycle, sendMessage internals, tool loop, turn-end persistence, recovery scenarios) — the conceptual foundation before we map it to VibeFrames in M4.

---

## 1. Why — problems plain Agent doesn't solve

The `Agent` class (covered in M2) is powerful for single-turn interactions: it takes a message, reasons about it, calls tools, and returns a response. But VibeFrames needs a **multi-turn editing session** — and that's a fundamentally different problem:

```
  PLAIN AGENT                                HARNESS
  ═══════════                                ═══════

  ┌──────────────┐                           ┌──────────────────────────────┐
  │  Request #1  │                           │  Request #1 (expensive)      │
  │              │                           │                              │
  │  load data   │  ← every time             │  construct Harness           │
  │  build prompt│  ← every time             │  init storage + skills       │
  │  create agent│  ← every time             │  hydrate state (data fetch)  │
  │  call LLM    │                           │  cache instance              │
  │  discard     │  ← gone                   │                              │
  └──────────────┘                           │  → READY (cached in memory)  │
                                             └──────────────────────────────┘
  ┌──────────────┐
  │  Request #2  │                           ┌──────────────────────────────┐
  │              │                           │  Request #2 (cheap)          │
  │  load data   │  ← again!                 │                              │
  │  build prompt│  ← again!                 │  setState({ selection })     │
  │  create agent│  ← again!                 │  sendMessage(prompt)         │
  │  call LLM    │                           │                              │
  │  discard     │  ← gone again             │  → done (same cached Harness)│
  └──────────────┘                           └──────────────────────────────┘

  ┌──────────────┐
  │  Request #3  │                           ┌──────────────────────────────┐
  │              │                           │  Request #3 (cheap)          │
  │  ...same     │  ← N times               │                              │
  │  ...overhead │                           │  setState + sendMessage      │
  └──────────────┘                           └──────────────────────────────┘
```

| Problem | Plain Agent | With Harness |
|---------|-------------|--------------|
| **State across turns** | None — every `.generate()` is stateless | Zod-typed state persisted per-thread, merged via `setState()` |
| **Context injection** | Static `instructions` string | Dynamic `instructions(state)` — a function that reads current state each turn |
| **Memory** | Must wire manually per call | Built-in, configured once — threads, message history, observational memory |
| **Tool context** | Tools get only their input | Tools read shared state via `requestContext` (project ID, selection, cached data) |
| **Mode switching** | One agent = one personality | Multiple modes (e.g., `vibe`, `plan`, `build`) — swap agent behavior without rebuilding |
| **Skills** | No concept of deferred knowledge | Workspace with skills — agent loads domain knowledge on demand, not upfront |
| **Lifecycle** | Create → call → discard | Create once (expensive) → reuse cheaply on every turn → cache per resource |
| **Events** | Stream text only | Rich event bus — `text.delta`, `tool.calling`, `tool.result`, `state_changed` |

The core insight: **creation is expensive, usage is cheap**. A Harness is created once per resource (project, user, session), hydrated with context, cached in memory, and reused on every subsequent chat turn with near-zero overhead.

---

## 2. What — anatomy of a Harness

A Harness bundles seven concerns into one runtime container:

```
  ANATOMY OF A HARNESS
  ════════════════════

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                       Harness<StateSchema>                                │
  │                                                                          │
  │  ┌──────────────────────────────────────────────────────────────────┐    │
  │  │                    THE FOUR STORES                                │    │
  │  │                                                                  │    │
  │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐   │    │
  │  │  │ ① STATE        │ │ ② THREADS      │ │ ③ MESSAGES         │   │    │
  │  │  │                │ │                │ │                    │   │    │
  │  │  │ Zod-validated  │ │ metadata:      │ │ conversation       │   │    │
  │  │  │ in-memory obj  │ │ tokenUsage,    │ │ history per thread │   │    │
  │  │  │ read by every  │ │ currentModeId, │ │ user + assistant   │   │    │
  │  │  │ instructions() │ │ modelId        │ │ + tool messages    │   │    │
  │  │  │ call each turn │ │ per-thread     │ │                    │   │    │
  │  │  │                │ │                │ │ rolling window     │   │    │
  │  │  │ NOT persisted  │ │ in storage     │ │ (lastMessages: N)  │   │    │
  │  │  │ to storage     │ │                │ │                    │   │    │
  │  │  └────────────────┘ └────────────────┘ └────────────────────┘   │    │
  │  │                                                                  │    │
  │  │  ┌──────────────────────────────────────────────────────────┐   │    │
  │  │  │ ④ OBSERVATIONAL MEMORY (OM)                               │   │    │
  │  │  │                                                           │   │    │
  │  │  │ one record per (resourceId, threadId)                     │   │    │
  │  │  │ observations text + reflection (compressed long-term ctx) │   │    │
  │  │  │ updated async AFTER run.complete — never blocks the user  │   │    │
  │  │  └──────────────────────────────────────────────────────────┘   │    │
  │  └──────────────────────────────────────────────────────────────────┘    │
  │                                                                          │
  │  ┌──────────────────────────────────────────────────────────────────┐    │
  │  │                    MODES (one active per turn)                    │    │
  │  │                                                                  │    │
  │  │  ┌─────────────────────────┐    ┌─────────────────────────┐     │    │
  │  │  │ Mode: plan (default)    │    │ Mode: vibe              │     │    │
  │  │  │                         │    │                         │     │    │
  │  │  │  Agent  ──► model       │    │  Agent  ──► model       │     │    │
  │  │  │             + instr(s)  │    │             + instr(s)  │     │    │
  │  │  │             + tools     │    │             + tools     │     │    │
  │  │  └─────────────────────────┘    └─────────────────────────┘     │    │
  │  └──────────────────────────────────────────────────────────────────┘    │
  │                                                                          │
  │  ┌──────────────────────────┐    ┌──────────────────────────────────┐    │
  │  │   WORKSPACE              │    │          EVENT BUS               │    │
  │  │                          │    │                                  │    │
  │  │   skills/                │    │  text.delta · tool.calling       │    │
  │  │   ├── domain-a/          │    │  tool.result · state_changed    │    │
  │  │   ├── domain-b/          │    │  run.complete · run.error       │    │
  │  │   └── domain-c/          │    │                                  │    │
  │  │                          │    │  harness.subscribe(listener)    │    │
  │  │   + Mastra built-ins:    │    │    → relay to SSE transport     │    │
  │  │     skill()              │    │                                  │    │
  │  │     skill_search()       │    │                                  │    │
  │  │     skill_read()         │    │                                  │    │
  │  └──────────────────────────┘    └──────────────────────────────────┘    │
  │                                                                          │
  │  id · resourceId · stateSchema · modes[] · disableBuiltinTools           │
  └──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 State

State is per-thread, Zod-validated, and the **shared context contract** that every mode, tool, and skill reads from.

```ts
const stateSchema = z.object({
  projectId: z.string(),
  currentComposition: z.unknown().optional(),
  selection: z.object({ /* ... */ }).optional(),
  // ...any project-specific fields
});
```

Key properties:
- **Typed** — Zod validates every `setState()` call at runtime
- **Merged** — `setState(patch)` shallow-merges onto existing state
- **Visible to instructions** — the dynamic `instructions()` function receives current state each turn
- **Readable by tools** — tools access state via `requestContext.get('harness').state`
- **Categorized by lifecycle**:
  - *Hydrated once* — expensive data fetched at creation (brand, composition)
  - *Refreshed per request* — changes before each turn (selection, auth token)
  - *Mutated by tools* — tools update state as side effects

### 2.2 Storage

Storage persists threads, messages, and memory records. The Harness and Memory subsystem **share one storage instance** — this is important:

```
                ┌───────────────────────────┐
                │       Harness             │
                │                           │
                │   storage: StorageProvider │──┐
                │   memory:  Memory(...)    │  │  shares the
                └────────┬──────────────────┘  │  same instance
                         │                     │
                         │                     │
                         ▼                     │
               ┌────────────────────────┐      │
               │    Storage Provider    │ ◄────┘
               │                        │
               │ • threads              │  ← ② thread metadata
               │ • messages[]           │  ← ③ conversation history
               │ • observational-memory │  ← ④ OM records
               │   record               │
               └────────────────────────┘
```

Mastra provides multiple backends:

| Provider | Package | Use case |
|----------|---------|----------|
| `LibSQLStore` | `@mastra/libsql` | Local dev — file-based SQLite, survives restart |
| `PgStore` | `@mastra/pg` | Production — Postgres (Neon, Supabase) |
| `InMemoryStore` | `@mastra/core` | Testing only — lost on process restart |

Storage is configured once and shared across all agents and harnesses. The choice of backend determines **what survives a restart** — `InMemoryStore` loses everything; `LibSQLStore` or `PgStore` preserve threads, messages, and OM records.

### 2.3 Memory

Memory sits on top of storage and manages what the agent "remembers" across turns. Four capabilities:

```
  MEMORY SUBSYSTEM
  ════════════════

  ┌───────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  ① MESSAGE HISTORY (on every turn)                                │
  │     Memory.listMessages(threadId, limit=lastMessages)             │
  │     → loads last N messages into the LLM context                  │
  │     → older messages drop off the window but stay in storage      │
  │                                                                   │
  │  ② OBSERVATIONAL MEMORY (async, after turn completes)             │
  │                                                                   │
  │     Trigger 1: messageTokens > observationThreshold (e.g. 30k)   │
  │     ───────────────────────────────────────────────────────────   │
  │     Observer model runs (cheap model, e.g. o4-mini):              │
  │       Input:  recent messages buffer                              │
  │       Output: compressed observation chunk                        │
  │       → saved to OM record                                        │
  │       → NEVER blocks the user (runs after response streams)       │
  │                                                                   │
  │     Trigger 2: observationTokens > reflectionThreshold (e.g. 40k)│
  │     ───────────────────────────────────────────────────────────   │
  │     Reflector model runs:                                         │
  │       Input:  all buffered observation chunks                     │
  │       Output: consolidated summary (replaces old observations)    │
  │                                                                   │
  │     How it gets back into the conversation:                       │
  │     On every turn, Memory loads OM observations text and          │
  │     prepends it to the system prompt. The agent never sees        │
  │     the raw older messages — only the summary.                    │
  │                                                                   │
  │  ③ WORKING MEMORY (structured, persistent)                        │
  │     User preferences, style choices, frequently used patterns     │
  │                                                                   │
  │  ④ SEMANTIC RECALL (vector search)                                │
  │     "Remember when I made that intro last week" style queries     │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘
```

**What the LLM actually sees each turn:**

```
  SYSTEM PROMPT
  ═════════════
    instructions(state)           ← dynamic, rebuilt from current state
    + skill metadata              ← names + descriptions only
    + tool JSON schemas           ← Zod schemas serialized
    + OM observations text        ← compressed long-term context (if any)

  CONVERSATION HISTORY
  ════════════════════
    user      ← message N - (lastMessages - 1)
    assistant ← message N - (lastMessages - 2)
    ...
    user      ← message N  (just sent)
```

If the user runs a 50-turn session with `lastMessages: 20`:
- Turns 1–20: agent sees full history
- Turn 21+: turn 1 drops from the prompt — BUT if OM has summarized it into observations, the context is preserved as a compressed summary at the top of the system prompt

For MVP, message history alone is sufficient. Observational memory is deferred.

### 2.4 Modes

A mode is: **one Agent + its tools + its instructions**. The harness holds an array of modes; only one is active per turn.

```ts
const vibeMode = {
  id: 'vibe',
  name: 'Vibe',
  default: true,
  agent: new Agent({
    id: 'composer',
    model: 'openai/o4-mini',
    instructions: ({ requestContext }) => {
      const state = requestContext.get('harness');
      return buildComposerPrompt(state);
    },
    tools: composerTools,
  }),
};
```

**Dynamic instructions** — the key trick. `instructions` is a *function*, not a static string. Every turn, Mastra calls it with the current state snapshot. This means:
- A composition change (via tool → `setState`) is visible to the next turn's prompt
- Selection context is injected fresh on every request
- No pod restart needed when state changes — the next turn picks it up

**Why modes matter**: VibeFrames starts with one mode (`vibe`), but the architecture supports adding `plan` (structured planning) and `build` (code generation) modes later without restructuring.

### 2.5 Workspace & Skills

Skills are deferred knowledge — domain expertise the agent loads on demand instead of carrying in every prompt.

```
workspace/skills/
├── hyperframes/     ← SKILL.md (composition rules, data attributes)
├── composition/     ← SKILL.md (JSON tree mutations, validation)
├── captions/        ← SKILL.md (word-level timing, pill-karaoke)
└── audio/           ← SKILL.md (volume, track layering)
```

When `workspace.skills` is configured, Mastra auto-mounts three built-in tools:

| Tool | What it does |
|------|--------------|
| `skill({ name })` | Loads the full `SKILL.md` body as a tool result |
| `skill_search(q)` | Searches skill metadata by keyword |
| `skill_read(path)` | Reads a specific file from a skill directory |

**How it works at runtime**:

```
Turn 1: User says "add captions to the intro"
  ↓
  Agent's system prompt lists skills by name + description
  (metadata only — the body is NOT in the prompt)
  ↓
  Agent decides it needs captioning rules. It calls:
     skill({ name: "captions" })
  ↓
  Mastra returns the full SKILL.md body as a tool_call_output
  ↓
Turn 2: Agent now has caption rules in context and can
  follow them — e.g., pill-karaoke timing, word boundaries
```

**Why this design**: total skill content might be 20–30 KB. Injecting all of it on every turn wastes tokens on unused knowledge. The agent loads only what the current request needs.

### 2.6 Tools

Tools are wired per-mode. Each tool has Zod input/output schemas and an `execute()` function. Tools access shared state via `requestContext`:

```ts
const getComposition = createTool({
  id: 'get-composition',
  description: 'Fetches the current composition for this project',
  inputSchema: z.object({}),
  outputSchema: z.object({ composition: z.unknown() }),
  execute: async (_, { requestContext }) => {
    const { projectId } = requestContext.get('harness').state;
    // fetch composition using projectId
    return { composition: /* ... */ };
  },
});
```

Tools can also *mutate state* as side effects:

```ts
execute: async (inputData, { requestContext }) => {
  const harness = requestContext.get('harness');
  // ... perform mutation ...
  harness.setState({ currentComposition: updatedTree });
  return { clipId: newClip.id };
},
```

**How state flows through tools:**

```
  1. ROUTE sets state before each message:
     ┌─────────────────────────────────────────────────────────┐
     │ POST /api/chat                                          │
     │ { prompt, threadId, selection }                         │
     │                                                         │
     │ harness.setState({                                      │
     │   selection: { clipId: "intro-1", intent: "edit" },     │
     │ });                                                     │
     │                                                         │
     │ harness.sendMessage({ content: prompt });               │
     └─────────────────────────────────────────────────────────┘
                              │
                              ▼
  2. AGENT reads state via dynamic instructions(state)
     → "user has selected intro-1, wants to edit"
                              │
                              ▼
  3. TOOLS read state via RequestContext:
     ┌─────────────────────────────────────────────────────────┐
     │ execute: async (input, { requestContext }) => {          │
     │   const harness = requestContext.get('harness');         │
     │   const { projectId, selection } = harness.state;       │
     │   // projectId scopes data access                       │
     │   // selection tells us what to target                   │
     │ }                                                       │
     └─────────────────────────────────────────────────────────┘
                              │
                              ▼
  4. TOOLS can mutate state as side effects:
     ┌─────────────────────────────────────────────────────────┐
     │ harness.setState({ currentComposition: updatedTree });   │
     │ // → next turn's instructions() sees the new tree       │
     └─────────────────────────────────────────────────────────┘
```

### 2.7 Built-in tools and maxSteps

Mastra's Harness auto-provides built-in tools to every agent. You should **disable the ones your UX doesn't support yet**:

| Built-in Tool | Purpose | Typical Status |
|---|---|---|
| `ask_user` | Pause generation, ask user a clarifying question, wait for response | Enable when FE has inline-question card |
| `submit_plan` | Propose multi-step plan for user approval before executing | Enable when FE has plan-approval flow |
| `task_write` | Create/update structured task list persisted across turns | Disable if not needed |
| `task_check` | Check task list completion status | Disable if not needed |

**Why disable:** without `disableBuiltinTools`, the agent sees these tools and may call them in a loop (up to `maxSteps`), burning tokens with no real work. If the FE doesn't render the card, the agent waits forever.

```ts
const harness = new Harness({
  // ...
  disableBuiltinTools: ['task_write', 'task_check', 'submit_plan'],
});
```

**maxSteps:** Mastra's default is 50 per `sendMessage()` call. Each "step" is one LLM call → tool call round-trip. Typical usage:
- No tools: agent responds in 1 step
- With tools: 3–8 steps (read context → plan → mutate → validate → respond)
- Default of 50 is generous — a safety net, not a target

### 2.8 Event bus

The harness emits events that the transport layer (SSE route) relays to the client:

| Event | Payload | When |
|-------|---------|------|
| `text.delta` | `{ text }` | Agent streams a text token |
| `tool.calling` | `{ toolName, args }` | Agent decides to call a tool |
| `tool.result` | `{ toolName, result }` | Tool execution completes |
| `state_changed` | `{ state }` | `setState()` was called |
| `run.complete` | `{ message }` | Agent finished the turn |
| `run.error` | `{ error }` | Something went wrong |

Subscribe to events:

```ts
harness.subscribe((event) => {
  switch (event.type) {
    case 'text.delta':
      sseStream.write(`data: ${JSON.stringify(event)}\n\n`);
      break;
    // ...
  }
});
```

---

## 3. How — lifecycle

Two phases: **creation** (expensive, happens once per resource) and **usage** (cheap, happens on every chat turn).

### 3.1 Creation (first request for a resource)

```
  First /chat for projectId X
              │
              ▼
  ┌──────────────────────────┐
  │  getHarness(X)           │
  │  cache.has(X)?  NO       │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  new Harness({           │    ← construct from @mastra/core
  │    id, resourceId: X,    │
  │    stateSchema,          │
  │    storage,              │
  │    memory,               │
  │    modes: [vibeMode],    │
  │    workspace: { skills } │
  │  })                      │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  harness.init()          │    ← wires storage, loads skills
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  harness.setState(       │    ← seed with project data
  │    initialState(X)       │
  │  )                       │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  Hydrate (parallel):     │    ← fetch expensive context
  │    loadComposition(X)    │
  │    loadProjectMeta(X)    │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  harness.setState({      │    ← cache in state
  │    composition,          │
  │    projectMeta,          │
  │  })                      │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  cache.set(X, harness)   │    ← cache the instance
  └────────┬─────────────────┘
           │
           ▼
       READY for chat
```

### 3.2 Usage (subsequent requests)

```
  Subsequent /chat for projectId X
              │
              ▼
  ┌──────────────────────────┐
  │  getHarness(X)           │
  │  cache.has(X)?  YES      │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  harness.setState({      │    ← refresh per-request data
  │    selection,            │
  │  })                      │
  └────────┬─────────────────┘
           │
           ▼
       READY for chat
```

### 3.3 Thread selection

Before the first message, the harness needs a conversation thread:

```
                          harness.selectOrCreateThread()
                                        │
                          ┌─────────────┴─────────────┐
                          │                            │
                    listThreads()               listThreads()
                    → empty array               → threads exist
                          │                            │
                          ▼                            ▼
                  createThread()              pick most recent
                  generate threadId           thread T
                  ② WRITE                            │
                          │                          │
                          └──────────┬───────────────┘
                                     ▼
                          loadThreadMetadata(T.id)         ② READ
                                     │
                          metadata: tokenUsage, currentModeId,
                              currentModelId, thresholds
```

### 3.4 Sending a message — what happens inside

This is the most important flow. Here's what `sendMessage()` does:

```
  INSIDE sendMessage({ content })
  ════════════════════════════════

  STEP 1: Build the prompt
  ┌──────────────────────────────────────────────────────────────┐
  │  Memory.listMessages(threadId, limit=lastMessages)           │  ③ READ
  │  → conversation history (last N messages)                    │
  │                                                              │
  │  Memory.getObservationalMemory(resourceId, threadId)         │  ④ READ
  │  → observations text (or null on first turn)                 │
  │                                                              │
  │  instructions(({ requestContext }) => ...)                    │  ① READ
  │  → pulls current state into the dynamic system prompt        │
  │                                                              │
  │  Mastra workspace processor:                                 │
  │  → lists skills (metadata only), adds tool JSON schemas      │
  └──────────────────────────────────────────────────────────────┘
                              │
                              ▼
  SYSTEM PROMPT assembled:
  ┌──────────────────────────────────────────────────────────────┐
  │  instructions(state)                                         │
  │  + skill registry (names + descriptions)                     │
  │  + N tool JSON schemas                                       │
  │  + OM observations text (if any)                             │
  │  + last N messages from history                              │
  │  + new user message                                          │
  └──────────────────────────────────────────────────────────────┘
                              │
                              ▼
  STEP 2: LLM call + tool loop
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LLM call #1                                                 │
  │       │                                                      │
  │       ▼                                                      │
  │  agent decides: which tools?                                 │
  │       │                                                      │
  │  ┌────┴─────────────────────────────────────────┐            │
  │  │   no tools              one or more tools     │            │
  │  │       │                      │                │            │
  │  │       ▼                      ▼                │            │
  │  │  final response       tool_start ──► SSE      │            │
  │  │                              │                │            │
  │  │                       tool.execute(args)      │            │
  │  │                       Mastra runs function    │            │
  │  │                              │                │            │
  │  │                       Tool may:               │            │
  │  │                         setState() ──► ① WRITE│            │
  │  │                         emitEvent() ──► SSE   │            │
  │  │                              │                │            │
  │  │                       tool_end ──► SSE        │            │
  │  │                              │                │            │
  │  │                       LLM call #2             │            │
  │  │                       (with tool result)      │            │
  │  │                              │                │            │
  │  └──────────────► loop back to "agent decides"   │            │
  │                                  │               │            │
  │                                  ▼               │            │
  │                     FINAL ASSISTANT MESSAGE       │            │
  └──────────────────────────────────────────────────────────────┘
                              │
                              ▼
  STEP 3: Turn end — persist and move on
  ┌──────────────────────────────────────────────────────────────┐
  │  Memory.saveMessages(                                        │
  │    [userMsg, assistantMsg, ...toolMsgs]                      │
  │  )                                                  ③ WRITE  │
  │                                                              │
  │  persistTokenUsage()                                         │
  │    storage.getThreadById(T)                         ② READ   │
  │    T.metadata.tokenUsage += usage                            │
  │    storage.saveThread(T)                            ② WRITE  │
  │                                                              │
  │  run.complete event ──► SSE to frontend                      │
  │  stream closed                                               │
  └──────────────────────────────────────────────────────────────┘
                              │
                              ▼
  STEP 4: Async background (non-blocking)
  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  │  if msgTokens > observationThreshold:                        │
  │    Observer LLM call → compress to observation chunk ④ WRITE │
  │  if observationTokens > reflectionThreshold:                 │
  │    Reflector LLM call → consolidate observations    ④ WRITE │
  │                                                              │
  │  User has already seen the full response by this point.      │
  │  OM never blocks a user-visible turn.                        │
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### 3.5 Route handler — the four-line version

With all the above internalized by the Harness:

```ts
// In your route handler:
const harness = await getOrCreateHarness(projectId);
harness.setState({ selection: req.body.selection });
harness.subscribe((event) => res.write(`data: ${JSON.stringify(event)}\n\n`));
await harness.sendMessage({ content: req.body.prompt });
```

### 3.6 Key instance methods

| Method | When | What it does |
|--------|------|--------------|
| `init()` | On creation | Loads workspace/skills, initializes storage |
| `setState(patch)` | Before each message | Merges patch into state (Zod-validated), emits `state_changed` |
| `getState()` | Route, tools | Read-only snapshot of current state |
| `sendMessage({ content })` | On user message | Runs agent with tools, emits events |
| `createThread({ title })` | On new conversation | Creates a conversation thread |
| `switchThread({ threadId })` | On thread switch | Loads different conversation |
| `subscribe(listener)` | On SSE setup | Listen for agent events |
| `abort()` | On user cancel | Stops in-progress generation |
| `selectOrCreateThread()` | On first message | Loads existing or creates new thread |

### 3.7 State write paths

Five places mutate harness state during a request lifecycle:

| # | Write | Where | What it sets |
|---|-------|-------|--------------|
| 1 | Initial | `getOrCreateHarness()` (cold start) | Initial state from schema defaults |
| 2 | Hydration | `getOrCreateHarness()` (cold start) | Expensive context fetched once (composition, project data) |
| 3 | Per-request refresh | Route handler (every request) | Selection, auth tokens, per-turn data |
| 4 | Tool side-effects | Inside `tool.execute()` | Composition mutations, current item ID, etc. |
| 5 | Thread metadata | `persistTokenUsage()` (after turn) | Token usage running totals |

Every write goes through `harness.setState(patch)` which:
1. Shallow-merges `patch` onto `this.state`
2. Validates against `stateSchema` (Zod)
3. Emits `state_changed` event with `{ state, changedKeys }`
4. **Does NOT persist to storage** — state is process-memory only

### 3.8 End-to-end timeline of one turn

```
TIME │  ① STATE              │  ② THREADS            │  ③ MESSAGES        │  ④ OM
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
 0ms │ setState(initial)     │                       │                    │
     │ (if cold start)       │                       │                    │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
20ms │ setState(hydrated     │                       │                    │
     │  context data)        │                       │                    │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
40ms │                       │ listThreads (read)    │                    │
     │                       │ createThread (write?) │                    │ initOM (new)
     │                       │ getThreadById (read)  │                    │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
50ms │ setState(selection)   │                       │                    │
     │ (per-request)         │                       │                    │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
60ms │   (build prompt)      │                       │ listMessages (read)│ getOM (read)
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
 1s+ │ ──── LLM call(s) + tool execution loop. setState calls fire as tools run. ──────
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
  8s │ setState              │                       │                    │
     │ (tool side-effects)   │                       │                    │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
 10s │                       │ getThreadById (read)  │ saveMessages       │
     │                       │ saveThread            │  (write — full     │
     │                       │  (write — tokenUsage) │   turn batch)      │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
     │  run.complete event sent. Stream closed.                           │
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
     │  (async) only when token thresholds crossed:                       │
     │                       │                       │                    │ updateObs
     │                       │                       │                    │ reflect?
─────┼───────────────────────┼───────────────────────┼────────────────────┼──────────────
DONE
```

---

## 4. What survives a restart

The storage backend determines what's durable:

### With InMemoryStore (testing only)

```
  What's PRESERVED                            Where it lives
  ────────────────                            ──────────────
  (nothing from ②③④)                          all in process memory

  What's GONE
  ────────────
  ① state (projectId, selection, etc.)         process memory only
  ② thread metadata (token totals, mode)       InMemoryStore (process)
  ③ chat history                               InMemoryStore (process)
  ④ OM observations + reflections              InMemoryStore (process)
```

After restart: fresh harness, fresh thread, empty history. User starts over.

### With LibSQLStore / PgStore (production)

```
  What's PRESERVED                            Where it lives
  ────────────────                            ──────────────
  ② thread metadata                           LibSQL file / Postgres
  ③ full chat history                         LibSQL file / Postgres
  ④ OM observations                           LibSQL file / Postgres

  What's GONE (and re-derived)
  ────────────
  ① state                                     re-hydrated on cold start
  ⑤ cached harness instances Map              rebuilt on first request
```

After restart: harness reconstructed → state re-hydrated → existing thread loaded → conversation continues.

### Recovery scenarios

| Scenario | State ① | Threads ② | Messages ③ | OM ④ |
|----------|---------|-----------|------------|------|
| Same process, new request | ✅ cached | ✅ cached | ✅ cached | ✅ cached |
| Same process, new thread | ✅ cached | ✅ new | ❌ empty | ❌ empty |
| Process restart (durable store) | 🔄 re-hydrate | ✅ from DB | ✅ from DB | ✅ from DB |
| Process restart (InMemoryStore) | 🔄 re-hydrate | ❌ gone | ❌ gone | ❌ gone |

---

## 5. The creation-is-expensive / usage-is-cheap principle

```
  COST PER OPERATION
  ══════════════════

  CREATION (once per resource)                  USAGE (every turn)
  ┌──────────────────────────────────────┐      ┌──────────────────────┐
  │  new Harness({...})          ~1 ms   │      │  setState()    ~0 ms │
  │  harness.init()              ~5 ms   │      │  sendMessage() ~LLM  │
  │    → storage.init()                  │      │                      │
  │    → workspace.init()                │      │  That's it.          │
  │    → scan skills/ directory          │      │                      │
  │  setState(initial)           ~0 ms   │      │  No DB reads.        │
  │  hydrate context (fetch)   ~50-200ms │      │  No skill scans.     │
  │  setState(hydrated data)     ~0 ms   │      │  No reconstruction.  │
  │  cache.set(X, harness)       ~0 ms   │      │                      │
  ├──────────────────────────────────────┤      ├──────────────────────┤
  │  TOTAL: ~60-210ms                    │      │  TOTAL: ~0ms + LLM   │
  └──────────────────────────────────────┘      └──────────────────────┘
```

The in-memory cache (`Map<resourceId, Harness>`) means the second, third, hundredth chat turn for the same project skips all creation overhead. The tradeoff: single-pod assumption. Multi-pod deployments need a shared store (Redis, external DB) to sync harness instances — noted as out of scope for MVP.

---

## 6. Dynamic instructions — state drives the prompt

The most powerful pattern in the Harness model: **instructions as a function of state**.

```ts
const agent = new Agent({
  instructions: ({ requestContext }) => {
    const state = requestContext.get('harness').state;
    return `
      You are a video composition assistant.

      ## Current project
      Project ID: ${state.projectId}

      ## Composition context
      ${state.composition
        ? `Current composition has ${state.composition.clips.length} clips.`
        : 'No composition yet. Start by creating one.'}

      ## User selection
      ${state.selection
        ? `User has selected: ${state.selection.clipId} (${state.selection.intent})`
        : 'No active selection.'}

      ## Rules
      - Always validate after making changes
      - Use tools to read and modify compositions
    `;
  },
});
```

Every turn, Mastra calls this function with fresh state. The prompt the model sees reflects the *current* reality — not a stale snapshot from harness creation time.

---

## 7. Comparison: Harness vs raw Agent setup

If you tried to build VibeFrames' multi-turn loop without Harness:

```ts
// WITHOUT Harness — manual wiring on every request
app.post('/api/chat', async (req, res) => {
  const { projectId, prompt, threadId, selection } = req.body;

  // 1. Load project data (every request!)
  const composition = await db.getComposition(projectId);
  const projectMeta = await db.getProjectMeta(projectId);

  // 2. Build instructions (inline, fragile)
  const instructions = `You are... Project: ${projectId}...`;

  // 3. Load message history (manual)
  const history = await db.getMessages(threadId);

  // 4. Call agent with everything
  const agent = new Agent({
    instructions,
    model: 'openai/o4-mini',
    tools: { /* rebuild tool list */ },
  });

  const result = await agent.stream([...history, { role: 'user', content: prompt }]);

  // 5. Save messages (manual)
  await db.saveMessage(threadId, { role: 'user', content: prompt });
  // ... save assistant response too

  // 6. Handle tool results, state updates (manual, error-prone)
});
```

```ts
// WITH Harness — all of the above is handled
app.post('/api/chat', async (req, res) => {
  const harness = await getOrCreateHarness(req.body.projectId);
  harness.setState({ selection: req.body.selection });
  harness.subscribe((event) => res.write(`data: ${JSON.stringify(event)}\n\n`));
  await harness.sendMessage({ content: req.body.prompt });
});
```

The Harness internalizes state management, memory, thread handling, tool context injection, and event streaming. Your route handler becomes four lines.

---

## 8. Patterns from production harnesses

The Harness architecture described here is proven in production multi-turn agent systems. Here are the patterns that matter:

### Pattern 1: Tool categories by access level

```
  ┌────────────────────────────────────────────────────────────┐
  │                    TOOL TAXONOMY                            │
  │                                                            │
  │  CONTEXT TOOLS (read-only, always safe)                    │
  │  ├── get-project-data    ← fetch project configuration     │
  │  ├── get-schemas         ← block/component definitions     │
  │  ├── list-items          ← enumerate existing content      │
  │  └── search-library      ← find reusable assets            │
  │                                                            │
  │  MUTATION TOOLS (write, require validation)                │
  │  ├── create-item         ← generate + validate + save      │
  │  ├── update-item         ← edit existing content           │
  │  └── save-item           ← persist to storage              │
  │                                                            │
  │  VALIDATION TOOLS (stateless, pure functions)              │
  │  ├── validate-structure  ← schema compliance               │
  │  ├── compliance-check    ← brand voice, tone, rules        │
  │  └── lint                ← structural quality checks       │
  │                                                            │
  │  Different modes may get different tool subsets:            │
  │  plan  mode → context tools only (read-only)               │
  │  vibe  mode → all tools (full mutation access)             │
  └────────────────────────────────────────────────────────────┘
```

### Pattern 2: Thick skills instead of many agents

Instead of spawning sub-agents for different domains (email rules, templating syntax, compliance), load domain knowledge as **skill files** that a single agent reads on demand. Benefits:
- No multi-agent coordination overhead
- No inter-agent state passing
- Token-efficient: agent only loads the skill it needs per turn
- Easier to debug: one agent, one system prompt, visible tool calls

### Pattern 3: State lifecycle categories

```
  ┌─────────────────────────────────────┐
  │           Harness State              │
  │                                     │
  │  ╔═══════════════════════════════╗  │
  │  ║  HYDRATED ONCE (at creation)  ║  │
  │  ║  expensive context fetched    ║  │
  │  ║  from DB / API / sidecar      ║  │
  │  ╚═══════════════════════════════╝  │
  │                                     │
  │  ╔═══════════════════════════════╗  │
  │  ║  REFRESHED PER REQUEST        ║  │
  │  ║  selection, auth tokens,      ║  │
  │  ║  per-turn ephemeral data      ║  │
  │  ╚═══════════════════════════════╝  │
  │                                     │
  │  ╔═══════════════════════════════╗  │
  │  ║  MUTATED BY TOOLS             ║  │
  │  ║  composition tree, current    ║  │
  │  ║  item ID, generated content   ║  │
  │  ╚═══════════════════════════════╝  │
  │                                     │
  │  ╔═══════════════════════════════╗  │
  │  ║  INIT-ONLY FLAGS              ║  │
  │  ║  feature gates, debug flags   ║  │
  │  ╚═══════════════════════════════╝  │
  └─────────────────────────────────────┘
```

### Pattern 4: Gateway tools (validate + save atomically)

Instead of separate validate → save steps, gateway tools combine both into one atomic operation. The tool validates the agent's output against structural rules, and only saves if validation passes. If it fails, it returns an error with fix instructions — the agent reads the error and self-corrects (typically 1–2 retries).

```
  Agent generates content
       │
       ▼
  gateway-tool({ content })
       │
       ├── validate structure  ──► FAIL → return { error, fix instructions }
       │                                        │
       │                                   Agent retries (max 3)
       │
       └── validation PASS → save to DB → return { success, id }
```

### Pattern 5: Model tier aliases

Use semantic aliases instead of hardcoding model IDs:

| Alias | Maps to | Use case |
|-------|---------|----------|
| `FAST_MODEL` | Haiku-class | Q&A, routing, simple chat |
| `DEFAULT_MODEL` | Sonnet-class | Content generation, design |
| `REASONING_MODEL` | Opus-class | Complex planning (future) |

The `resolveModel` function on the Harness maps aliases to concrete provider + model combinations. Modes reference aliases; the resolver handles provider fallback.

### Summary

VibeFrames adapts these same patterns to video composition. The state schema, tools, and skills change — the Harness architecture stays identical.

---

## 9. What's next

- **M4** — Our Harness — VHLD: map the Harness shape to VibeFrames (state schema, mode, skills, tools, memory strategy, events)
- **M5** — HLD: tools, SSE, render pipeline, composition model, UI bridging
