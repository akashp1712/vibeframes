# Harness — Why, What, How

> **TL;DR** — A Mastra `Harness` is a long-lived runtime container for multi-turn agent conversations. It bundles state (Zod-typed, per-thread), storage, memory, modes (swappable agent personalities), workspace (skills loaded on demand), and tools into one class. The plain `Agent` from M2 handles single-turn reasoning; the Harness adds everything needed for a stateful, multi-turn editing session. This doc covers why it exists, what it holds, and how it works — the conceptual foundation before we map it to VibeFrames in M4.

---

## 1. Why — problems plain Agent doesn't solve

The `Agent` class (covered in M2) is powerful for single-turn interactions: it takes a message, reasons about it, calls tools, and returns a response. But VibeFrames needs a **multi-turn editing session** where:

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

The core insight: **creation is expensive, usage is cheap**. A Harness is created once per resource (project, user, session), hydrated with context (brand, composition, preferences), cached in memory, and then reused on every subsequent chat turn with near-zero overhead.

---

## 2. What — anatomy of a Harness

A Harness bundles seven concerns into one runtime container:

```
┌────────────────────────────────────────────────────────────────┐
│                    Harness<StateSchema>                         │
│                                                                │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │    STATE     │   │   STORAGE   │   │       MEMORY        │  │
│  │ Zod-typed   │   │  threads    │   │  message history    │  │
│  │ per-thread  │   │  messages   │   │  observational mem  │  │
│  │ merged via  │   │  OM records │   │  working memory     │  │
│  │ setState()  │   │             │   │  semantic recall    │  │
│  └─────────────┘   └─────────────┘   └─────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MODE (active)                          │  │
│  │                                                          │  │
│  │   Agent  ──►  model + instructions(state) + tools        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────┐   ┌───────────────────────────────────┐  │
│  │   WORKSPACE      │   │          EVENT BUS                │  │
│  │   skills/        │   │  text.delta · tool.calling        │  │
│  │   (loaded on     │   │  tool.result · state_changed      │  │
│  │    demand)       │   │  run.complete · run.error         │  │
│  └──────────────────┘   └───────────────────────────────────┘  │
│                                                                │
│  id · resourceId · stateSchema · modes[] · disableBuiltinTools │
└────────────────────────────────────────────────────────────────┘
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

Storage persists threads, messages, and memory records. Mastra provides multiple backends:

| Provider | Package | Use case |
|----------|---------|----------|
| `LibSQLStore` | `@mastra/libsql` | Local dev — file-based SQLite |
| `PgStore` | `@mastra/pg` | Production — Postgres (Neon, Supabase) |
| `InMemoryStore` | `@mastra/core` | Testing — lost on restart |

Storage is configured once on the `Mastra` instance and shared across all agents and harnesses.

### 2.3 Memory

Memory sits on top of storage and manages what the agent "remembers" across turns:

- **Message history** — last N messages per thread (e.g., `lastMessages: 20`)
- **Observational memory** — background agents compress old messages into dense observations when tokens exceed a threshold, keeping the context window bounded
- **Working memory** — persistent structured data (user preferences, goals)
- **Semantic recall** — vector search over past messages

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

### 2.7 Event bus

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

### 3.3 Sending a message

```ts
// In your route handler:
const harness = await getOrCreateHarness(projectId);

// Refresh per-request state
harness.setState({ selection: req.body.selection });

// Subscribe to events → relay to SSE
harness.subscribe((event) => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
});

// Send the user's message
await harness.sendMessage({
  content: req.body.prompt,
  threadId: req.body.threadId,
});
```

### 3.4 Key instance methods

| Method | When | What it does |
|--------|------|--------------|
| `init()` | On creation | Loads workspace/skills, initializes storage |
| `setState(patch)` | Before each message | Merges patch into state (Zod-validated) |
| `getState()` | Route, tools | Read-only snapshot of current state |
| `sendMessage({ content })` | On user message | Runs agent with tools, emits events |
| `createThread({ title })` | On new conversation | Creates a conversation thread |
| `switchThread({ threadId })` | On thread switch | Loads different conversation |
| `subscribe(listener)` | On SSE setup | Listen for agent events |
| `abort()` | On user cancel | Stops in-progress generation |
| `selectOrCreateThread()` | On first message | Loads existing or creates new thread |

---

## 4. The creation-is-expensive / usage-is-cheap principle

This is the core architectural insight. Consider the cost breakdown:

| Phase | Operations | Cost | Frequency |
|-------|-----------|------|-----------|
| **Creation** | Construct Harness, init storage, hydrate composition, fetch project meta, cache instance | High (multiple async calls, DB reads) | Once per project per pod |
| **Usage** | `setState()` with per-request data, `sendMessage()` | Low (state merge + LLM call) | Every chat turn |

The in-memory cache (`Map<projectId, Harness>`) means the second, third, hundredth chat turn for the same project skips all creation overhead. The tradeoff: single-pod assumption. Multi-pod deployments need a shared store (Redis, external DB) to sync harness state — noted as out of scope for MVP.

---

## 5. Dynamic instructions — state drives the prompt

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

## 6. Comparison: Harness vs raw Agent setup

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

## 7. Reference implementation

The patterns described here are proven in the mc-studio project (the user's existing work project), where a `Harness<StudioState>` powers a multi-turn email/SMS composition agent with:
- 16 tools (context, mutation, validation, generation)
- 6+ skills (email, SMS, handlebars, data-binding, etc.)
- Observational memory (30k token observation threshold, 40k token reflection)
- Dynamic instructions that inject brand markdown and selection context per turn
- In-memory cache per project ID
- SSE event streaming to a React frontend

VibeFrames adapts this same pattern to video composition. The state schema, tools, and skills change — the Harness architecture stays identical.

---

## 8. What's next

- **M4** — Our Harness — VHLD: map the Harness shape to VibeFrames (state schema, mode, skills, tools, memory strategy, events)
- **M5** — HLD: tools, SSE, render pipeline, composition model, UI bridging
