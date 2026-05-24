# 00 — Origin Story

> **TL;DR** — Two things crossed paths in the same week: HeyGen open-sourced **HyperFrames** (write HTML, render video, designed for agents), and **Mastra's `Harness` class** showed up as a fully-featured agent runtime. VibeFrames is the bet that those two belong together — a chat-first studio where a conversational agent composes videos for you.

---

## How the idea came together

**HyperFrames** ([github](https://github.com/heygen-com/hyperframes)) is HeyGen's open-source video framework. The pitch is six words: *"Write HTML. Render video. Built for agents."* A composition is an HTML document with `data-start` / `data-duration` / `data-track-index` attributes. There's no DSL, no proprietary timeline, no React-component graph — just markup that an LLM already knows how to write. Ships with a `<hyperframes-player>` web component for browser preview, a `hyperframes render` CLI for deterministic MP4 output, a 50+ block catalog (`hyperframes add data-chart`), and a set of agent skills that teach Claude / Cursor / Codex how to author valid compositions (`npx skills add heygen-com/hyperframes`).

**Mastra Harness** is the other half. A `Harness` is a runtime class that bundles state (Zod-validated), storage (threads + messages), memory (observational), modes (multiple agents under one umbrella), workspace skills (lazy-loaded `SKILL.md` files), tools, subagents, and an event bus — all the machinery a conversational multi-turn agent actually needs, packaged once. The Harness owns the loop; the agent just declares its instructions, tools, and model.

The two read like halves of the same idea. HyperFrames wants an agent to drive it. Mastra Harness wants a domain to drive. VibeFrames is the bridge: **a chat-first studio where a Mastra-Harness-powered agent composes HyperFrames videos for you** — a video editor you talk to, with a real UI behind it.

---

## What it does

- **4-pane editor** — asset library · preview · timeline · properties · chat
- **Conversational composition** — *"make a 15-second product intro with a fade-in title and background music"* → agent calls tools → timeline updates live → preview re-renders via `<hyperframes-player>`
- **Visible agent state** — reasoning, tool calls, and validation results stream in the chat panel; nothing is hidden
- **Manual + agentic editing share one source** — drag-resize a clip or chat-edit it; both mutate the same canonical `jsonTree`
- **Versioned compositions** — save, reload, switch between versions

## How it works (one paragraph)

A Mastra Harness wraps the agent in a single `vibe` mode (Composer agent, OpenAI reasoning model). Tools mutate a canonical `jsonTree`; mutations emit `composition.delta` events (RFC 6902 JSON Patch). A pure `serialize()` function turns `jsonTree` → HyperFrames HTML, fed into `<hyperframes-player>`. SSE streams every phase to the UI: `agent.thinking`, `agent.responding`, `tool.calling`, `tool.executing`, `tool.result`, `composition.delta`. Single user, single tab, desktop only — at least for now.

---

## Out of scope

- A replacement for HyperFrames. VibeFrames is a studio *on top of* HyperFrames.
- Multi-tenant collab or real-time multiplayer. Single user, single session.
- Mobile / offline / native. Desktop browser only.
- Cross-engine portability. The composition format is HyperFrames-native.

---

## What comes next

- **M1** — explore HyperFrames properly: install `@hyperframes/player`, render a hello-world composition, map the package landscape, and answer one question: *where exactly does an agent multiply this stack?*
- **M2** — the Mastra primer, building up from AI SDK → LLM → Agent → Tools → Workflows, so the Harness deep-dive in M3 lands on prepared ground.

See [`docs/README.md`](./README.md) for the full module map.
