# 🎬 VibeFrames

> **An AI agent that directs real videos — through conversation.**
> You describe the video you want. A Mastra **AgentController** turns it into a
> structured composition, calling one typed tool per scene, and **Remotion**
> renders it — previewed live in the browser and exportable to a real MP4.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![Engine: Remotion](https://img.shields.io/badge/Engine-Remotion-0b84f3.svg)](https://remotion.dev)
[![Agent: Mastra](https://img.shields.io/badge/Agent-Mastra%20AgentController-cyan.svg)](https://mastra.ai)

</div>

---

## ✨ The idea

Editing video is click-heavy and slow. VibeFrames replaces the timeline with a
conversation: you **describe**, an agent **directs**. The trick is a clean seam —
the agent never touches pixels. It produces a typed JSON **composition**; Remotion
turns that JSON into frames. The agent is smart about *what* the video says; the
renderer is deterministic about *how* it looks.

---

## 🚀 How it works

```
  ┌──────────┐  prompt  ┌─────────────────────────────────┐   JSON   ┌────────────┐
  │          │ ───────► │      Mastra AgentController      │ ───────► │  Remotion  │
  │   You    │          │   ┌───────────────────────────┐  │ (clips)  │  <Player>  │
  │ describe │          │   │  Director agent            │  │          │  + render  │
  │  a video │ ◄─────── │   │  add-clip · get-composition│  │ ◄──────  │  → MP4     │
  │          │   SSE    │   └───────────────────────────┘  │          │            │
  └──────────┘  events  └─────────────────────────────────┘          └────────────┘
```

1. **You prompt** the Director (e.g. *"a 10s teaser for Bolt DB — queries run 40x faster"*).
2. **The Director composes.** It calls `add-clip` once per scene, in order,
   choosing a block (`KineticTitle`, `BulletReveal`, `StatReveal`, `LogoOutro`) and
   filling its props. Each call appends to the project's composition JSON.
3. **SSE streams the work** back to the studio — you watch scenes appear in the
   timeline and the live `<Player>` preview update as the agent builds.
4. **Export** hits `/api/render`, which runs Remotion server-side
   (`bundle → selectComposition → renderMedia`) and returns a real 1080p MP4.

There's no brief/storyboard/validate ceremony and no HTML video engine — one agent,
two tools, a typed composition, and a real renderer.

---

## 🧱 Architecture

### 1. Harness & AgentController Structure

The Mastra `AgentController` governs the project-level orchestration. Each project's lifecycle is isolated in a dynamic, stateful `Session` backed by a SQLite database:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MASTRA AGENTCONTROLLER                             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Project Session (isolated state)                  │  │
│  │                                                                       │  │
│  │   Memory (LibSQL) ◄───────►  [ Agent Mode ]  ◄─────► System Prompt    │  │
│  │   (Threads & Messages)        (Director)         (instructions +      │  │
│  │                                   ▲               compose skill)      │  │
│  │                                   │                                   │  │
│  │                                   ▼                                   │  │
│  │                             [ Workspace ]                             │  │
│  │                         ┌─────────┴─────────┐                         │  │
│  │                         ▼                   ▼                         │  │
│  │                 Skills Registry     Local Filesystem                  │  │
│  │                 (compose.md)        (director/skills/)                │  │
│  │                                                                       │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼ (Registered System Tools)            │
│                            ┌───────────────────┐                            │
│                            │    Agent Tools    │                            │
│                            ├───────────────────┤                            │
│                            │ add-clip          │                            │
│                            │ clear-composition │                            │
│                            │ get-composition   │                            │
│                            └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Data Flow: Composition to Render Output

The journey from a user's natural language request to progressive browser rendering, and finally to a compiled MP4 video:

```
┌─────────────────┐             1. Send Prompt            ┌──────────────────┐
│                 │ ────────────────────────────────────► │                  │
│                 │                                       │   /api/chat      │
│                 │ ◄──────────────────────────────────── │                  │
│                 │       3. Progressive SSE Stream       └────────┬─────────┘
│  Studio Client  │        (tool_start, tool_end, etc.)            │
│  (Next.js App)  │                                                │ 2. Agent runs
│                 │ ◄──────────────────────┐                       │    tool loop
│                 │                        │                       ▼
│                 │    5. stable state     │              ┌──────────────────┐
│                 │       derivation       │              │ Harness Director │
│                 │                        │              │ (Mastra Session) │
└────────┬────────┘                        │              └────────┬─────────┘
         │                                 │                       │
         │ 4. Read inputProps              │                       │ writes to
         ▼                                 │                       ▼
┌─────────────────┐                        │              ┌──────────────────┐
│ Remotion Player │ ───────────────────────┘              │   Composition    │
│    (Browser)    │                                       │   Store (Disk)   │
└─────────────────┘                                       └────────┬─────────┘
                                                                   │
┌─────────────────┐                 6. Read JSON                   │
│   /api/render   │ ◄──────────────────────────────────────────────┘
│  (Remotion SSR) │
└────────┬────────┘
         │
         │ 7. bundle + renderMedia (deterministic)
         ▼
┌─────────────────┐
│   Output MP4    │
│ (public/exports)│
└─────────────────┘
```

### The seam: one typed composition

The agent and the renderer meet at exactly one place — the composition JSON
(`src/harness/composition/schema.ts`):

```ts
type Composition = {
  fps: number; width: number; height: number;
  clips: {
    id: string;
    block: "KineticTitle" | "BulletReveal" | "StatReveal" | "LogoOutro";
    from: number;              // start frame (30fps)
    durationInFrames: number;
    props: Record<string, unknown>;   // block-specific
  }[];
};
```

The agent **writes** it (via `add-clip`); Remotion **reads** it (via `VibeVideo`).
Neither knows the other's internals.

### The agent (Mastra AgentController + Session)

- **`src/harness/index.ts`** — creates one `AgentController` per project and a live
  `Session` to drive it. Cached so LibSQL + memory aren't rebuilt per request.
- **`src/harness/director/`** — the single agent: `agent.ts` (Mastra wiring),
  `prompt.ts` (a ~16-line system prompt — the block-picking guidance lives in the
  tool schema, not the prompt).
- **`src/harness/tools/`** — `add-clip` (append a scene) and `get-composition`
  (inspect). The `projectId` is injected server-side via `RequestContext`, so the
  agent never has to pass it.
- **State is deliberately tiny** (`state.ts`): just the project handle. The
  composition itself lives in a disk-backed store (`composition/store.ts`).

### The renderer (Remotion)

- **`src/remotion/blocks/`** — each block is a React component that's a pure
  function of `useCurrentFrame()` (spring/interpolate animation). Add a block here
  + to the schema enum to teach the agent a new scene type.
- **`src/remotion/VibeVideo.tsx`** — maps the composition JSON onto blocks with
  `<Sequence>`, over an always-on `Backdrop` (drifting glows + grain).
- **`src/remotion/Root.tsx`** — the SSR entry; `calculateMetadata` sizes each render
  to the actual composition.

### Transport & UI

- **`src/app/api/chat/route.ts`** — SSE: subscribes to the session's event bus,
  filters noise, streams `tool_start`/`tool_end`/`text_delta`/`run.*` to the client.
- **`src/app/api/render/route.ts`** — Remotion SSR → MP4 (input-validated against
  path traversal).
- **`src/components/studio/`** — the Director's console: `Topbar`, `Feed` (meaningful
  agent activity — "Added a stat — 40x"), `Composer` (prompt + starter templates),
  `Stage` (`<Player>`), `Timeline`. Light editorial theme, consistent with the
  marketing site.

---

## 🛠️ Tech stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Agent runtime** | [Mastra](https://mastra.ai) 1.50 `AgentController` + `Session` | Session-oriented host: one agent, typed state, streamed events. |
| **Video engine** | [Remotion](https://remotion.dev) | React → deterministic video. Same components preview *and* render. |
| **Model** | OpenAI `gpt-4o` by default; Claude Opus 5.5 (`claude-opus-5-5`) optional via [AI SDK](https://sdk.vercel.ai) | Set `VIBEFRAMES_MODEL=claude-opus-5-5` and `ANTHROPIC_API_KEY` to opt in. |
| **Framework** | Next.js 16 (App Router), React 19 | SSE routes, per-project `/studio/[projectId]`. |
| **Storage** | LibSQL (file-backed) | Threads, messages, composition snapshots. |
| **UI** | Tailwind v4 + MagicUI | Warm editorial light theme, subtle motion. |

---

## 🏃 Run it locally

```bash
pnpm install
echo "OPENAI_API_KEY=sk-..." > .env.local     # required for the Director
pnpm dev                                        # http://localhost:3000
```

- **`/`** — the marketing page (with a live Remotion sample in the hero).
- **`/studio`** — mints a project and opens the console. Pick a template or
  describe a video, watch it build, then **Export MP4**.

To run the Director with Claude Opus 5.5, set `VIBEFRAMES_MODEL=claude-opus-5-5`
and `ANTHROPIC_API_KEY` in `.env.local`. OpenAI remains the default; do not
change the model ID without configuring its matching provider key.

Useful env: `VIBEFRAMES_MODEL` (agent model), `VIBEFRAMES_DATA_DIR` (composition
store), `VIBEFRAMES_WORKSPACE` (scratch workspace dir).

---

## 🗺️ Status

**v0.1** — the full loop is real and verified end-to-end: prompt → agent → typed
composition → live preview → exported MP4.

Next: richer block palette, audio/narration, in-timeline editing, and deploy
(Remotion Lambda for at-scale rendering).

## 📄 License

MIT.
