# ADR-001 — SSE for chat transport

**Status**: Accepted  
**Date**: 2025-05-24  
**Deciders**: Project author  

## Context

VibeFrames needs to stream AI responses (text tokens, tool calls, reasoning summaries, composition deltas) from server to client in real time. The transport must support multiple event types, work on Vercel serverless, and be simple to implement.

## Options considered

1. **Polling** — client polls `/api/status` at intervals
2. **Request/Response** — single response, no streaming
3. **Server-Sent Events (SSE)** — server pushes typed events over HTTP
4. **WebSockets** — persistent bi-directional connection
5. **RSC Streaming** — React Server Components streamed via Next.js

## Decision

**SSE** — Server-Sent Events over a POST route handler.

## Rationale

- SSE supports typed events via the `event:` field — maps directly to our 9-event protocol
- Works on Vercel serverless (Edge and Node route handlers)
- Built-in browser reconnection via `EventSource` + `Last-Event-ID`
- No client library needed beyond native `EventSource` (or a fetch-based SSE reader for POST)
- Simple to implement: server writes `event:` + `data:` + `\n\n`
- We don't need bi-directional streaming — user sends discrete POST, server streams responses

## Tradeoffs

- **No binary data** — fine, all our events are JSON
- **Unidirectional** — fine, user input is discrete (POST per message)
- **No native POST support in EventSource** — we use a fetch-based SSE reader (e.g., `@microsoft/fetch-event-source` or a 20-line custom reader)
- **Vercel 30s timeout on Hobby** — agent turns may exceed this; Pro plan extends to 5 min. For MVP on Hobby, we accept the limit.

## Consequences

- All server → client communication goes through SSE events defined in `05-hld-tools-flows.md` §2
- Client parses events with a typed handler per event name
- Reconnection handled by browser retry (3s default) + `Last-Event-ID` replay
- WebSocket upgrade path exists if we later need server-push outside of chat turns (e.g., collaborative editing)
