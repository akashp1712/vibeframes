# LLD-04 · SSE Chat Protocol

Status: Implemented (M9)
Owner: VibeFrames
Last updated: 2026-05-29
Related: ADR-001 (transport choice), LLD-03 (Harness wiring)

## TL;DR

`/api/chat` is a POST returning **Server-Sent Events**. Each event is a `VibeFramesEvent` envelope wrapping a Mastra harness event. The client uses `fetch` + `ReadableStream` to read it (not `EventSource`, because POST).

## Envelope

```ts
interface VibeFramesEvent {
  v: 1;              // protocol version
  runId: string;     // UUID, same for every event in a single POST
  seq: number;       // monotonic, starts at 1
  projectId: string;
  ts: number;        // epoch ms
  type: string;      // event type — see below
  payload: any;      // shape depends on type
}
```

Wire format per event:

```
id: 7
event: tool_end
data: {"v":1,"runId":"a3f...","seq":7,"projectId":"vercel-intro","ts":1780...,"type":"tool_end","payload":{...}}

```

Each frame ends with `\n\n`. Comments and `event: heartbeat` frames are kept alive every 5 seconds so proxies don't drop the connection.

## Event types

Three groups, mapped from Mastra harness events.

### Lifecycle (`run.*`)

| Type           | When                                  | Payload                                       |
| -------------- | ------------------------------------- | --------------------------------------------- |
| `run.start`    | First event after request open        | `{ status:"started", content:string }`        |
| `run.complete` | Agent loop finished cleanly           | `{ status:"completed" }`                      |
| `run.error`    | Agent threw / our wrapper caught      | `{ status:"error", message:string }`          |

### Agent stream

| Type             | Source                              | Payload (key fields)              |
| ---------------- | ----------------------------------- | --------------------------------- |
| `agent_start`    | Mastra mode run begins              | `{ modeId, agentId }`             |
| `text_delta`     | LLM streams a text chunk            | `{ textDelta:string }`            |
| `message_update` | Cumulative message snapshot         | `{ message:{ content:[...] } }`   |
| `message_end`    | Assistant turn done                 | `{ message:{ content:[...] } }`   |
| `agent_end`      | Mode run finished                   | `{ modeId, agentId }`             |
| `usage_update`   | Token usage observed                | `{ promptTokens, completionTokens }` |

### Tools

| Type         | When                          | Payload                                                          |
| ------------ | ----------------------------- | ---------------------------------------------------------------- |
| `tool_start` | Agent decides to call a tool  | `{ toolCallId, toolName, args:{...} }`                           |
| `tool_end`   | Tool execution finished       | `{ toolCallId, toolName, result:{...}, isError?:boolean }`       |

### Filtered (never re-emitted)

The server drops these to keep the wire lean. They're Mastra internals the client never needs:

- `display_state_changed`
- `tool_input_start`
- `tool_input_delta`
- `tool_input_end`

## Server implementation

`src/app/api/chat/route.ts` is intentionally tiny:

```ts
const harness = await getVibeFramesHarness(projectId);
await harness.selectOrCreateThread();

const { stream, writeEvent, writeHeartbeat, endStream } = createSSEStream();
const runId = randomUUID();
const seq = { value: 0 };

const unsubscribe = harness.subscribe((event) => {
  if (FILTERED_EVENT_TYPES.has(event.type)) return;
  emit(event.type, event);
});

emit("run.start", { status:"started", content });
await harness.sendMessage({ content });
emit("run.complete", { status:"completed" });

unsubscribe();
endStream();
return new Response(stream, { headers: { "Content-Type":"text/event-stream", ... } });
```

`createSSEStream()` (in `src/protocol/sse-writer.ts`) returns a Web `ReadableStream` plus three writer fns. Pure Web Streams API so it runs unchanged on Vercel Edge or Node.

## Client implementation

`useHarnessChat` (in `src/harness/use-harness-chat.ts`) is a single-file React hook:

```ts
const res = await fetch("/api/chat", { method:"POST", body:JSON.stringify({...}) });
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream:true });
  const blocks = buffer.split("\n\n");
  buffer = blocks.pop() ?? "";
  for (const block of blocks) {
    const dataMatch = block.match(/^data: (.*)$/m);
    if (!dataMatch) continue;
    const env = JSON.parse(dataMatch[1]);
    dispatch(env);   // switch on env.type
  }
}
```

Dispatch maps event types to state changes:

| Event           | UI effect                                                                 |
| --------------- | ------------------------------------------------------------------------- |
| `run.start`     | `status = "thinking"`                                                     |
| `text_delta`    | append delta to current assistant message; `status = "streaming"`         |
| `tool_start`    | push tool card with `state:"calling"`; `status = "calling-tool"`          |
| `tool_end`      | update tool card to `state:"result"` with `result`+`durationMs`           |
| `message_end`   | replace assistant content with full text (canonical)                      |
| `run.complete`  | `status = "done"`; clear loading                                          |
| `run.error`     | `status = "error"`; surface via `error`                                   |

## Heartbeats

Every 5 seconds the server writes a `event: heartbeat\ndata: {}\n\n` frame. The client checks `block.includes("event: heartbeat")` and skips it. Without this, sfproxy/Cloudflare/etc. will idle-close the SSE connection after 30–60s.

## Why not `useChat` from AI SDK

`useChat` decodes the AI SDK *data stream* format (`0:`, `1:`, `2:` framed lines), which our server doesn't emit. We could write a translator, but it would lose all the harness-specific event richness (skills loading, plan approval, sub-agents). Owning the protocol keeps us flexible.

## Why not `EventSource`

`EventSource` only does GET. We need POST (request body carries `messages` + `projectId`). The fetch+ReadableStream pattern above is standard.

## Open questions

- **Reconnection** — currently a dropped SSE means the run is lost. mc-studio-services backs the harness with durable storage so the next reconnect can resume from `seq`. We'll do this when persistence lands.
- **Backpressure** — the server doesn't `await` the controller's `desiredSize`. Fine for ~10 events/second; might matter under high text_delta rates with a slow client.
