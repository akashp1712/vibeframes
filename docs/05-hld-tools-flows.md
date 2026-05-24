# HLD — Tools, SSE, Render, Composition, UI Bridging

> **TL;DR** — This is the parent HLD. Five subsystems: (1) SSE transport for chat, (2) event protocol with payload specs, (3) canonical JSON composition model with pure-function mutations, (4) render pipeline (browser preview vs CLI MP4), and (5) UI bridging — what each React component subscribes to. ADR-001 (SSE chat transport) is recorded alongside.

---

## 1. Chat transport — why SSE?

### The problem

VibeFrames streams AI responses token-by-token while interleaving tool calls, reasoning summaries, and composition deltas. We need a transport that:

- Delivers **server-initiated events** (agent thinks → responds → calls tools → mutates composition)
- Supports **multiple event types** in one stream
- Works with **Vercel serverless** (Edge/Node route handlers)
- Is **simple to implement** on both server and client

### Decision matrix

```
+========================+==========+==========+==========+==========+============+
|       Criteria         | Polling  | Req/Res  |   SSE    |    WS    | RSC Stream |
+========================+==========+==========+==========+==========+============+
|                        |          |          |          |          |            |
|  Server-push events    |    ✗     |    ✗     |    ✓     |    ✓     |     ✓      |
|                        |          |          |          |          |            |
|  Multiple event types  |    ✗     |    ✗     |    ✓     |    ✓     |     ~      |
|                        |          |          |          |          |            |
|  Vercel-friendly       |    ✓     |    ✓     |    ✓     |    ✗     |     ✓      |
|  (serverless)          |          |          |          |          |            |
|                        |          |          |          |          |            |
|  Auto-reconnect        |    n/a   |    n/a   |    ✓     |    ✗     |     ✗      |
|  (built-in)            |          |          |          |          |            |
|                        |          |          |          |          |            |
|  Binary data           |    ✓     |    ✓     |    ✗     |    ✓     |     ✗      |
|                        |          |          |          |          |            |
|  Complexity            |   low    |   low    |   low    |  medium  |   medium   |
|                        |          |          |          |          |            |
|  Bi-directional        |    ✗     |    ✗     |    ✗     |    ✓     |     ✗      |
|                        |          |          |          |          |            |
+========================+==========+==========+==========+==========+============+

        WINNER: SSE ─────────────────────────────────────────────►  ✓ ✓ ✓ ✓
```

### Why not WebSockets?

- Vercel doesn't support persistent WS connections on serverless
- We don't need bi-directional streaming — user sends discrete messages via POST, server streams responses
- SSE auto-reconnects; WS requires manual reconnection logic

### Why not RSC streaming?

- RSC streaming is great for UI components but awkward for typed event protocols
- We need structured JSON events (`tool.calling`, `composition.delta`), not React component streams
- SSE gives us explicit event types via the `event:` field

**Decision: SSE** → recorded as ADR-001 (see `docs/decisions/ADR-001-sse-chat-transport.md`)

### How it works end-to-end

```
    ┌──────────┐                              ┌──────────────┐
    │  Client  │                              │    Server     │
    │  (React) │                              │  (Next.js)   │
    └────┬─────┘                              └──────┬───────┘
         │                                           │
         │  POST /api/chat                           │
         │  { projectId, prompt, threadId,           │
         │    selection? }                           │
         │ ─────────────────────────────────────────►│
         │                                           │
         │                              getOrCreateHarness(projectId)
         │                              harness.setState({ selection })
         │                              harness.subscribe(event => write)
         │                              harness.sendMessage({ content })
         │                                           │
         │  HTTP 200  Content-Type: text/event-stream│
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: agent.thinking                    │
         │  data: { }                                │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: tool.calling                      │
         │  data: { toolName, args }                 │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: composition.delta                 │
         │  data: { op, path, value }                │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: agent.responding                  │
         │  data: { text: "Done — I added..." }      │
         │◄──────────────────────────────────────────│
         │                                           │
         │  event: run.complete                      │
         │  data: { message, usage }                 │
         │◄──────────────────────────────────────────│
         │                                           │
    ┌────┴─────┐                              ┌──────┴───────┐
    │  Client  │                              │    Server     │
    └──────────┘                              └──────────────┘
```

---

## 2. SSE event protocol

Nine event types. Each has a fixed `event:` name and a JSON `data:` payload.

### Event catalog

```
╔═══════════════════════╦══════════════════════════════════════════════════╗
║       Event           ║   Payload                                        ║
╠═══════════════════════╬══════════════════════════════════════════════════╣
║                       ║                                                  ║
║  run.start            ║  { runId, threadId, timestamp }                  ║
║                       ║                                                  ║
║  agent.thinking       ║  { reasoningSummary?: string }                   ║
║                       ║                                                  ║
║  agent.responding     ║  { text: string }       ← streamed chunk         ║
║                       ║                                                  ║
║  tool.calling         ║  { callId, toolName, args }                      ║
║                       ║                                                  ║
║  tool.executing       ║  { callId, toolName }   ← tool started           ║
║                       ║                                                  ║
║  tool.result          ║  { callId, toolName, result, success, error? }   ║
║                       ║                                                  ║
║  composition.delta    ║  { op, path, value?, oldValue? }                 ║
║                       ║                                                  ║
║  run.complete         ║  { message, usage: { prompt, completion, total }}║
║                       ║                                                  ║
║  run.error            ║  { error, code, recoverable }                    ║
║                       ║                                                  ║
╚═══════════════════════╩══════════════════════════════════════════════════╝
```

### Event lifecycle for a single turn

```
                    ┌─────────────────────────────────────────────┐
                    │            SINGLE AGENT TURN                 │
                    └─────────────────────────────────────────────┘

     ① run.start
     │
     ├──② agent.thinking          (optional — when model uses reasoning)
     │   │
     │   ├──③ tool.calling         (agent decides to call a tool)
     │   │   │
     │   │   ├──④ tool.executing   (tool begins execution)
     │   │   │
     │   │   ├──⑤ composition.delta  (if tool mutates composition)
     │   │   │
     │   │   └──⑥ tool.result      (tool finished)
     │   │
     │   ├── ③→④→⑤→⑥              (may repeat for multiple tools)
     │   │
     │   └──⑦ agent.responding     (streamed text tokens)
     │       │
     │       └── (chunks repeat until done)
     │
     └──⑧ run.complete            (always — final event)
            │
            └── OR ⑨ run.error    (on failure)
```

### Wire format example

```
event: run.start
data: {"runId":"run-a1b2","threadId":"thread-xyz","timestamp":"2025-05-24T13:22:00Z"}

event: agent.thinking
data: {"reasoningSummary":"Checking current composition for clip durations..."}

event: tool.calling
data: {"callId":"call-1","toolName":"get-composition","args":{}}

event: tool.executing
data: {"callId":"call-1","toolName":"get-composition"}

event: tool.result
data: {"callId":"call-1","toolName":"get-composition","result":{"clips":3,"duration":15},"success":true}

event: tool.calling
data: {"callId":"call-2","toolName":"update-clip","args":{"clipId":"title-1","duration":6}}

event: tool.executing
data: {"callId":"call-2","toolName":"update-clip"}

event: composition.delta
data: {"op":"replace","path":"/clips/title-1/duration","value":6,"oldValue":4}

event: tool.result
data: {"callId":"call-2","toolName":"update-clip","result":{"clipId":"title-1"},"success":true}

event: agent.responding
data: {"text":"Done — "}

event: agent.responding
data: {"text":"I extended the title clip "}

event: agent.responding
data: {"text":"to 6 seconds."}

event: run.complete
data: {"message":"Done — I extended the title clip to 6 seconds.","usage":{"prompt":1240,"completion":82,"total":1322}}

```

### Reconnection

SSE has built-in reconnection via `Last-Event-ID`. Each event carries an `id:` field:

```
id: evt-001
event: agent.responding
data: {"text":"Done — "}
```

On reconnect, the browser sends `Last-Event-ID: evt-001`. The server replays missed events from that point. For MVP, we rely on the browser's native `EventSource` retry (3 seconds default). Advanced buffering is deferred.

---

## 3. Composition pipeline

### The canonical JSON tree

The composition is stored as a typed JSON tree — the **single source of truth** for the video. HyperFrames HTML is a serialization format, not the canonical form.

```
                 CANONICAL JSON TREE
                 ═══════════════════

     ┌────────────────────────────────────────────────┐
     │  Composition                                    │
     │  ├── id: "comp-001"                             │
     │  ├── title: "My Video"                          │
     │  ├── width: 1920                                │
     │  ├── height: 1080                               │
     │  ├── fps: 30                                    │
     │  ├── duration: 15  (computed from clips)        │
     │  │                                              │
     │  └── clips[]                                    │
     │      │                                          │
     │      ├── ┌─────────────────────────────────┐    │
     │      │   │  Clip                           │    │
     │      │   │  id: "bg-gradient"              │    │
     │      │   │  type: "element"                │    │
     │      │   │  trackIndex: 0                  │    │
     │      │   │  start: 0                       │    │
     │      │   │  duration: 15                   │    │
     │      │   │  content: { tag: "div", ... }   │    │
     │      │   └─────────────────────────────────┘    │
     │      │                                          │
     │      ├── ┌─────────────────────────────────┐    │
     │      │   │  Clip                           │    │
     │      │   │  id: "title-1"                  │    │
     │      │   │  type: "text"                   │    │
     │      │   │  trackIndex: 1                  │    │
     │      │   │  start: 0.5                     │    │
     │      │   │  duration: 5                    │    │
     │      │   │  content: { text: "Hello", ... }│    │
     │      │   │  animation: { gsap: {...} }     │    │
     │      │   └─────────────────────────────────┘    │
     │      │                                          │
     │      └── ┌─────────────────────────────────┐    │
     │          │  Clip                           │    │
     │          │  id: "music-1"                  │    │
     │          │  type: "audio"                  │    │
     │          │  trackIndex: 2                  │    │
     │          │  start: 0                       │    │
     │          │  duration: 15                   │    │
     │          │  content: { src: "bgm.mp3" }    │    │
     │          │  volume: 0.4                    │    │
     │          └─────────────────────────────────┘    │
     │                                                 │
     └─────────────────────────────────────────────────┘
```

### Clip types

```
+══════════════+═══════════════════════════════════════════════════════+
|    Type      |  What it represents                                   |
+══════════════+═══════════════════════════════════════════════════════+
|  "video"     |  <video> clip — src, mediaStart, volume, hasAudio     |
|  "image"     |  <img> — src, objectFit                               |
|  "audio"     |  <audio> — src, volume, mediaStart                    |
|  "text"      |  Text overlay — text, font, size, color, position     |
|  "element"   |  Arbitrary HTML element — tag, style, children        |
|  "nested"    |  Nested composition — compositionSrc or inline clips  |
+══════════════+═══════════════════════════════════════════════════════+
```

### Mutations as pure functions

Every composition change is a **pure function**: `(tree, operation) → (newTree, delta)`. No side effects. The delta is emitted as a `composition.delta` SSE event.

```
    ┌───────────────────┐         ┌────────────────────┐
    │   Current Tree    │         │   Operation        │
    │   (immutable)     │         │   { op, path,      │
    │                   │         │     value }         │
    └────────┬──────────┘         └─────────┬──────────┘
             │                              │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │   mutate(tree, op)  │   ← pure function
             └─────────┬───────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │   New Tree       │  │   Delta          │
    │   (immutable)    │  │   { op, path,    │
    │                  │  │     value,        │
    │                  │  │     oldValue }    │
    └──────────────────┘  └──────────────────┘
              │                    │
              │                    │
              ▼                    ▼
       setState(tree)       composition.delta
       (harness state)      (SSE event → UI)
```

### Mutation operations

```
+════════════+══════════════════════════════════════════════════+
|     Op     |  Description                                     |
+════════════+══════════════════════════════════════════════════+
|  "add"     |  Insert a new clip at a path                     |
|  "replace" |  Update a value at a path                        |
|  "remove"  |  Delete a clip or property                       |
|  "move"    |  Change trackIndex or position in clips array    |
+════════════+══════════════════════════════════════════════════+
```

Paths use JSON Pointer syntax: `/clips/title-1/duration`, `/meta/title`, `/clips/title-1/content/text`.

### Serialization: JSON tree → HyperFrames HTML

```
  ┌─────────────────────┐
  │  Canonical JSON Tree │
  │  (source of truth)   │
  └──────────┬──────────┘
             │
             │  serialize()
             ▼
  ┌─────────────────────┐
  │  HyperFrames HTML   │
  │                     │
  │  <div data-          │
  │   composition-id>   │
  │    <h1 class="clip" │
  │     data-start="0.5"│
  │     data-duration=   │
  │     "5" ...>        │
  │  </div>             │
  └──────────┬──────────┘
             │
             │  load into
             ▼
  ┌─────────────────────┐
  │  <hyperframes-      │
  │   player>           │
  │  (browser preview)  │
  └─────────────────────┘
```

The serializer is a pure function: `serialize(tree: Composition) → string`. It generates valid HyperFrames HTML with all data attributes and GSAP timeline registration.

Deserialization (`parse(html) → Composition`) is deferred — for MVP, the JSON tree is always the source. We never parse HTML back into JSON.

---

## 4. Render pipeline

Two paths: **browser preview** (instant, MVP) and **MP4 export** (post-launch).

```
  ┌────────────────────────────────────────────────────────────┐
  │                    RENDER PIPELINE                          │
  │                                                            │
  │         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
  │                                                            │
  │         │  JSON Tree                               │       │
  │              │                                             │
  │         │    │ serialize()                          │       │
  │              ▼                                             │
  │         │  HyperFrames HTML                        │       │
  │              │                                             │
  │         └─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘       │
  │              │                                             │
  │     ┌────────┴────────┐                                    │
  │     │                 │                                    │
  │     ▼                 ▼                                    │
  │                                                            │
  │  ╔═══════════════╗  ╔══════════════════════════════════╗   │
  │  ║  PATH A       ║  ║  PATH B                          ║   │
  │  ║  Browser      ║  ║  MP4 Export (post-launch)        ║   │
  │  ║  Preview      ║  ║                                  ║   │
  │  ║               ║  ║  hyperframes render              ║   │
  │  ║  <hyperframes ║  ║    │                             ║   │
  │  ║   -player>    ║  ║    ├── Chrome headless            ║   │
  │  ║               ║  ║    │   beginFrame capture          ║   │
  │  ║  • Instant    ║  ║    │                             ║   │
  │  ║  • Seekable   ║  ║    ├── FFmpeg encode              ║   │
  │  ║  • Embedded   ║  ║    │                             ║   │
  │  ║  • Hot reload ║  ║    └── output.mp4                 ║   │
  │  ║               ║  ║                                  ║   │
  │  ║  MVP ✓        ║  ║  Deferred (Inngest workflow)     ║   │
  │  ╚═══════════════╝  ╚══════════════════════════════════╝   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### Path A — Browser preview (MVP)

```
  ┌──────────┐     serialize()     ┌──────────────┐     load      ┌────────────────┐
  │  JSON    │ ──────────────────► │  HTML file   │ ────────────► │ <hyperframes-  │
  │  Tree    │                     │  (in-memory  │               │  player>       │
  │          │                     │   or Blob)   │               │                │
  └──────────┘                     └──────────────┘               │  iframe +      │
                                                                  │  Shadow DOM    │
       on composition.delta:                                      │                │
       re-serialize → reload player                               │  controls,     │
                                                                  │  autoplay,     │
                                                                  │  seekable      │
                                                                  └────────────────┘
```

- Player loads the HTML in an iframe (isolated CSS/JS)
- On `composition.delta`, re-serialize and reload (or hot-patch if the player supports it)
- Playback controls mirror native `<video>` — play, pause, seek, scrub

### Path B — MP4 export (post-launch)

```
  User clicks "Export MP4"
       │
       ▼
  POST /api/render { compositionId }
       │
       ▼
  Inngest workflow (background job):
       │
       ├── 1. Fetch composition from DB
       ├── 2. Serialize to HTML
       ├── 3. Run `hyperframes render` CLI
       │       (Node 22+ · Chrome headless · FFmpeg)
       ├── 4. Upload MP4 to Vercel Blob
       └── 5. Notify client via webhook / polling
```

Deferred because:
- Requires Node 22+ and FFmpeg on the render server
- Long-running (10–120s depending on duration/complexity)
- Needs background job infrastructure (Inngest)
- Browser preview is sufficient for the editing loop

---

## 5. UI bridging — what each component subscribes to

### The four-pane editor layout

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │  ┌───────────┐  ┌──────────────────────────────┐  ┌───────────────┐  │
  │  │           │  │                              │  │               │  │
  │  │  ASSET    │  │         PREVIEW              │  │  PROPERTIES   │  │
  │  │  LIBRARY  │  │                              │  │               │  │
  │  │           │  │   ┌──────────────────────┐   │  │  clip: title  │  │
  │  │  blocks   │  │   │  <hyperframes-player>│   │  │  start: 0.5  │  │
  │  │  media    │  │   │                      │   │  │  duration: 5 │  │
  │  │  uploads  │  │   │    ▶  00:03 / 00:15  │   │  │  text: Hello │  │
  │  │           │  │   └──────────────────────┘   │  │  fontSize: 72│  │
  │  │           │  │                              │  │               │  │
  │  └───────────┘  └──────────────────────────────┘  └───────────────┘  │
  │                                                                      │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │                        TIMELINE                                │  │
  │  │  Track 0  ║████████████████████████████████████████████████║   │  │
  │  │           ║         bg-gradient (0-15s)                    ║   │  │
  │  │  Track 1  ║     ║████████████████║                         ║   │  │
  │  │           ║     ║  title (0.5-5.5s)                        ║   │  │
  │  │  Track 2  ║████████████████████████████████████████████████║   │  │
  │  │           ║         music (0-15s)                          ║   │  │
  │  │           ╠════╤════╤════╤════╤════╤════╤════╤════╤════╤═══╣   │  │
  │  │           0    2    4    6    8   10   12   14   16        │   │  │
  │  └────────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │  💬 CHAT DRAWER (slides from right)                            │  │
  │  │                                                                │  │
  │  │  ┌─ Agent ──────────────────────────────────────────────────┐  │  │
  │  │  │  ▸ Thinking: checking composition for clip durations...  │  │  │
  │  │  │  ⚙ Tool: update-clip({ clipId: "title-1", duration: 6 })│  │  │
  │  │  │  ✓ Done                                                  │  │  │
  │  │  │  I extended the title clip to 6 seconds.                 │  │  │
  │  │  └──────────────────────────────────────────────────────────┘  │  │
  │  │                                                                │  │
  │  │  ┌──────────────────────────────────────────┐ [Send]           │  │
  │  │  │  make the intro longer                   │                  │  │
  │  │  └──────────────────────────────────────────┘                  │  │
  │  └────────────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────┘
```

### Event → Component mapping

```
  ╔══════════════════════════╦═════════════════════════════════════════════╗
  ║  SSE Event               ║  UI Component & Action                      ║
  ╠══════════════════════════╬═════════════════════════════════════════════╣
  ║                          ║                                             ║
  ║  run.start               ║  Chat: show loading indicator               ║
  ║                          ║                                             ║
  ║  agent.thinking          ║  Chat: collapsible "Thinking..." block      ║
  ║                          ║  (expand to see reasoning summary)          ║
  ║                          ║                                             ║
  ║  tool.calling            ║  Chat: tool card — name + args (pending)    ║
  ║                          ║                                             ║
  ║  tool.executing          ║  Chat: tool card spinner                    ║
  ║                          ║                                             ║
  ║  tool.result             ║  Chat: tool card ✓/✗ badge                  ║
  ║                          ║                                             ║
  ║  composition.delta       ║  Preview: re-render player                  ║
  ║                          ║  Timeline: update clip bars                 ║
  ║                          ║  Properties: refresh if selected clip       ║
  ║                          ║                                             ║
  ║  agent.responding        ║  Chat: append text chunk to message bubble  ║
  ║                          ║                                             ║
  ║  run.complete            ║  Chat: finalize message, show token badge   ║
  ║                          ║  All: clear loading states                  ║
  ║                          ║                                             ║
  ║  run.error               ║  Chat: inline error message                 ║
  ║                          ║  Toast: recoverable = retry button          ║
  ║                          ║                                             ║
  ╚══════════════════════════╩═════════════════════════════════════════════╝
```

### Optimistic delta application

When the agent calls a mutation tool, the UI doesn't wait for `tool.result` — it applies the `composition.delta` optimistically:

```
  tool.calling  ──────────────► UI shows pending tool card
       │
  composition.delta  ─────────► UI applies delta immediately
       │                         │
       │                         ├── Preview: re-serializes + reloads
       │                         ├── Timeline: moves/resizes clip bar
       │                         └── Properties: updates values
       │
  tool.result (success) ─────► UI confirms (✓ badge on tool card)
       │
  tool.result (failure) ─────► UI reverts delta (rollback from oldValue)
                                UI shows ✗ badge + error
```

This keeps the UI responsive — the preview updates as soon as the delta arrives, not after the full tool round-trip.

### Chat message anatomy

A single agent turn renders as a composite message:

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🤖 Composer                                          2.1s  │
  │                                                              │
  │  ▸ Thinking                                    [collapse ▾]  │
  │    Checking the current composition. The title clip          │
  │    is at 4 seconds. User wants it longer...                  │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ⚙ get-composition                              ✓   │    │
  │  │  → 3 clips, 15s total                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ⚙ update-clip                                  ✓   │    │
  │  │  → title-1: duration 4s → 6s                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ⚙ validate-composition                         ✓   │    │
  │  │  → valid, no warnings                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Done — I extended the title clip to 6 seconds. The          │
  │  composition validates cleanly with no overlap warnings.     │
  │                                                              │
  │                                        1,322 tokens          │
  └──────────────────────────────────────────────────────────────┘
```

---

## 6. Full request flow — putting it all together

One user message, end to end:

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  USER                                                                │
  │  "make the title clip 2 seconds longer"                              │
  │  [selection: { clipId: "title-1", intent: "edit" }]                  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │  POST /api/chat
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ROUTE HANDLER                                                       │
  │                                                                      │
  │  1. getOrCreateHarness("proj-1")        ← cache hit                  │
  │  2. harness.setState({ selection })     ← inject selection           │
  │  3. harness.subscribe(events → SSE)     ← wire event stream          │
  │  4. harness.sendMessage({ content })    ← start agent turn           │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  HARNESS → MODE → AGENT                                             │
  │                                                                      │
  │  instructions(state):                                                │
  │    "You are Composer. Project: proj-1.                               │
  │     Composition: 3 clips, 15s.                                       │
  │     Selection: title-1 (intent: edit).                               │
  │     Use tools to modify."                                            │
  │                                                                      │
  │  ┌─ LLM Reasoning ──────────────────────────────────────────────┐   │
  │  │  User wants title clip longer by 2s.                         │   │
  │  │  Current: title-1 duration=4s. New: 6s.                      │   │
  │  │  Plan: get-composition → update-clip → validate.             │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                      │
  │  Tool calls:                                                         │
  │    ① get-composition({})            → reads state.composition        │
  │    ② update-clip({ clipId, dur })   → mutates tree, emits delta     │
  │    ③ validate-composition({})       → pure validation, no mutation   │
  │                                                                      │
  │  Final text: "Done — I extended the title clip to 6 seconds."        │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │  SSE events stream back
               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  CLIENT                                                              │
  │                                                                      │
  │  Chat panel:     thinking → tool cards → response text               │
  │  Preview:        re-rendered on composition.delta                     │
  │  Timeline:       title-1 bar extended to 6s                          │
  │  Properties:     duration field updated to 6                         │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 7. What's next

- **ADR-001** — SSE chat transport (recorded in `docs/decisions/`)
- **M6** — Tech stack base: versions, package choices, config
- **M7** — UI system: branding, palette, component picks, wireframes
