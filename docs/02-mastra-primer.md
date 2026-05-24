# Mastra Primer

> **TL;DR** — Mastra is a TypeScript framework for building AI agents. It layers on top of Vercel's AI SDK, adding agents, tools, memory, workflows, and streaming. This doc builds the mental model bottom-up: AI SDK → LLM + reasoning → Agent → Tool → Workflow → Memory. Each concept gets a code snippet and a "why this matters for VibeFrames" note.

---

## 1. AI SDK — the foundation

The [Vercel AI SDK](https://ai-sdk.dev) is the TypeScript toolkit that standardizes LLM integration across providers (OpenAI, Anthropic, Google, etc.). Two main libraries:

- **AI SDK Core** — unified API for text generation, structured output, tool calls
- **AI SDK UI** — framework-agnostic hooks (`useChat`, `useCompletion`) for chat UIs

The simplest call:

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-4o',
  prompt: 'What is a video composition?',
});
```

For streaming (token-by-token delivery):

```ts
import { streamText } from 'ai';

const result = streamText({
  model: 'openai/gpt-4o',
  prompt: 'Explain HyperFrames in one paragraph.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

**Why this matters for VibeFrames**: Mastra uses the AI SDK under the hood. When you configure a model in Mastra, you're configuring an AI SDK model. Understanding `generateText` and `streamText` makes Mastra's `.generate()` and `.stream()` immediately familiar.

---

## 2. LLM + reasoning parameters

Mastra uses the AI SDK's model router syntax: `'provider/model-name'`. You don't import provider-specific packages — Mastra resolves the provider for you.

```ts
const agent = new Agent({
  model: 'openai/o4-mini',
  // ...
});
```

For OpenAI's reasoning models (`o4-mini`, `o3`, etc.), two parameters control thinking behavior:

| Parameter          | What it does                                      | Values                     |
|--------------------|---------------------------------------------------|----------------------------|
| `reasoningEffort`  | How hard the model thinks before answering         | `'low'`, `'medium'`, `'high'` |
| `reasoningSummary` | Whether to expose reasoning in the response        | `'auto'`, `'concise'`, `'detailed'` |

Usage in Mastra (passed via model configuration at call time):

```ts
const response = await agent.generate('Design a 30-second intro video', {
  reasoningEffort: 'high',
  reasoningSummary: 'concise',
});
```

**Why this matters for VibeFrames**: We default to `o4-mini` with explicit reasoning params. The agent's thinking process (visible via `reasoningSummary`) feeds the UI's "reasoning collapse" component — users can expand to see *why* the agent chose a particular composition structure.

---

## 3. Agent — the reasoning loop

A Mastra `Agent` wraps a model with instructions, tools, and memory into a reasoning loop. The agent decides which tools to call, how many times to loop, and when to stop.

```ts
import { Agent } from '@mastra/core/agent';

const composerAgent = new Agent({
  id: 'composer',
  name: 'Composer Agent',
  instructions: `
    You are a video composition assistant.
    Use tools to read, modify, and validate compositions.
    Always validate after making changes.
  `,
  model: 'openai/o4-mini',
  tools: { /* ... */ },
});
```

Two ways to use an agent:

```ts
// Full response (waits for all tool calls to complete)
const response = await agent.generate('Add a title clip');
console.log(response.text);

// Streaming (tokens arrive as they're generated)
const stream = await agent.stream('Add a title clip');
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

Agents vs raw `streamText`:

| Dimension       | `streamText` (AI SDK)            | `Agent` (Mastra)                      |
|-----------------|-----------------------------------|---------------------------------------|
| Instructions    | Per-call system prompt             | Persistent system prompt              |
| Tools           | Per-call tool list                 | Registered once, always available     |
| Memory          | None                               | Thread-based, cross-turn              |
| Reasoning loop  | Single completion                  | Multi-step with tool calls            |
| Registration    | Standalone function                | Registered in `Mastra` instance       |

**Why this matters for VibeFrames**: The Composer agent is the core of VibeFrames. It receives user messages, reasons about composition edits, calls tools to mutate the JSON tree, and streams responses back via SSE. One agent, one mode (`vibe`), many tools.

---

## 4. Tool — typed actions

A `Tool` is a typed function the agent can call. It has:
- **`id`** — unique identifier
- **`description`** — tells the agent when/how to use it
- **`inputSchema`** — Zod schema for input validation
- **`outputSchema`** — Zod schema for return type
- **`execute`** — the async function that runs

```ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const addClipTool = createTool({
  id: 'add-clip',
  description: 'Adds a new clip to the composition timeline',
  inputSchema: z.object({
    type: z.enum(['video', 'image', 'audio', 'text']),
    trackIndex: z.number(),
    start: z.number(),
    duration: z.number(),
    content: z.record(z.unknown()),
  }),
  outputSchema: z.object({
    clipId: z.string(),
    composition: z.unknown(),
  }),
  execute: async (inputData) => {
    const { type, trackIndex, start, duration, content } = inputData;
    // Pure function: create clip, insert into composition tree
    const clipId = `clip-${Date.now()}`;
    return { clipId, composition: { /* updated tree */ } };
  },
});
```

Wire tools to an agent:

```ts
const agent = new Agent({
  id: 'composer',
  tools: { addClipTool, removeClipTool, validateComposition },
  // ...
});
```

The agent reads tool descriptions and schemas to decide when to call them. Good descriptions = better tool selection.

**Why this matters for VibeFrames**: Tools are the bridge between agent reasoning and composition state. VibeFrames will have three tool categories:
- **Context** — `get-project`, `get-composition`, `search-blocks`, `get-block-schemas`
- **Mutation** — `add-clip`, `update-clip`, `remove-clip`, `reorder`, `set-meta`
- **Validation** — `validate-composition`

---

## 5. Workflow — deterministic multi-step

A `Workflow` is a deterministic sequence of steps with typed inputs/outputs. Unlike agents (which reason about what to do), workflows follow a predefined path.

```ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const formatStep = createStep({
  id: 'format',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    return { formatted: inputData.message.toUpperCase() };
  },
});

const logStep = createStep({
  id: 'log',
  inputSchema: z.object({ formatted: z.string() }),
  outputSchema: z.object({ logged: z.boolean() }),
  execute: async ({ inputData }) => {
    console.log(inputData.formatted);
    return { logged: true };
  },
});

const pipeline = createWorkflow({
  id: 'format-and-log',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ logged: z.boolean() }),
})
  .then(formatStep)
  .then(logStep)
  .commit();
```

Agents vs Workflows:

| Dimension        | Agent                          | Workflow                        |
|------------------|--------------------------------|---------------------------------|
| Control flow     | LLM decides                    | Developer defines               |
| Steps            | Unknown upfront                | Known, typed, deterministic     |
| Use case         | Open-ended reasoning           | Multi-step pipelines            |
| Error handling   | Agent retries / adapts         | Explicit error steps            |
| Suspend/resume   | No                             | Yes (human-in-the-loop)         |

Workflows can also be used as tools — an agent calls a workflow like any other tool.

**Why this matters for VibeFrames**: Workflows are **out of scope for MVP** (we use a single agent with tools). But they become relevant post-launch for render pipelines (e.g., composition → validate → render → upload) orchestrated via Inngest as a workflow runner.

---

## 6. Memory — cross-turn context

Memory lets an agent remember messages, responses, and tool results across turns. Without memory, every `.generate()` or `.stream()` call is stateless.

```ts
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

const agent = new Agent({
  id: 'composer',
  memory: new Memory({
    options: {
      lastMessages: 20,           // keep last 20 messages in context
    },
  }),
  // ...
});
```

Using memory requires a `resource` (user) and `thread` (conversation):

```ts
const response = await agent.generate('Add a title that says "Hello"', {
  memory: {
    resource: 'user-123',
    thread: 'project-abc',
  },
});

// Later, same thread:
const response2 = await agent.generate('Make that title bigger', {
  memory: {
    resource: 'user-123',
    thread: 'project-abc',
  },
});
// Agent remembers the title from the previous turn
```

Memory requires a **storage provider** (e.g., `@mastra/libsql`) configured on the `Mastra` instance:

```ts
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';

const mastra = new Mastra({
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:local.db',      // LibSQL file for local dev
  }),
  agents: { composerAgent },
});
```

### Memory types

| Type                  | What it does                                              | VibeFrames plan      |
|-----------------------|-----------------------------------------------------------|----------------------|
| **Message history**   | Stores raw messages per thread                             | ✅ MVP (LibSQL)      |
| **Observational**     | Background agents compress old messages into observations  | ⏳ Post-launch       |
| **Working memory**    | Persistent structured data (names, prefs, goals)           | ⏳ Post-launch       |
| **Semantic recall**   | Vector search over past messages                           | ⏳ Post-launch       |

**Why this matters for VibeFrames**: Memory is how the agent maintains context across a multi-turn composition session. The user says "add a title", then later "make it blue" — the agent needs to know which title. Thread-scoped message history (backed by LibSQL) handles this for MVP. Observational memory (which compresses long conversations) is deferred.

---

## 7. Putting it together — the Mastra instance

The `Mastra` class is the application container that wires agents, storage, and tools into a single instance:

```ts
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { composerAgent } from './agents/composer';

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: 'vibeframes-storage',
    url: 'file:local.db',
  }),
  agents: {
    composerAgent,
  },
});

// Usage
const agent = mastra.getAgent('composerAgent');
const stream = await agent.stream('Create a 30-second intro video', {
  memory: { resource: 'user-1', thread: 'project-1' },
});
```

---

## 8. Concept stack (bottom-up)

```
┌─────────────────────────────────────────────┐
│              Mastra Instance                 │
│  storage · agents · workflows · logging      │
├─────────────────────────────────────────────┤
│              Agent                           │
│  instructions · model · tools · memory       │
├─────────────────────────────────────────────┤
│         Tools              Memory            │
│  Zod schemas · execute()   threads · history │
├─────────────────────────────────────────────┤
│              AI SDK                          │
│  generateText · streamText · model router    │
├─────────────────────────────────────────────┤
│           LLM Provider                       │
│  OpenAI (o4-mini) · Anthropic · Google       │
└─────────────────────────────────────────────┘
```

Read bottom-up: the LLM provider does the thinking, the AI SDK normalizes the interface, tools give the agent actions, memory gives it context, and the Mastra instance ties it all together.

---

## 9. What's next

The next doc (M3) goes deeper into the **Harness** — the runtime container that sits above the `Agent` class and bundles state, modes, workspace, skills, and events into a long-lived conversational session. Harness is what makes VibeFrames' multi-turn editing loop possible.

- **M3** — Harness: why, what, how
- **M4** — Our Harness: VHLD (mapping Harness shape to VibeFrames)
