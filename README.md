# VibeFrames

> A chat-first AI video studio. Talk to an agent, watch the timeline build. **Mastra Harness** on top of **HeyGen HyperFrames**.

**Status**: pre-code. Architecture and design docs are landing first.

Start here → [`docs/README.md`](./docs/README.md)

---

## What it is

A web app with a 4-pane editor (asset library · preview · timeline · properties) and a chat panel. You describe the video; an agent composes it. The agent's tools mutate a canonical composition tree that serialises to HyperFrames HTML, which renders in a `<hyperframes-player>` web component in real time. Manual edits in the timeline and properties panel write to the same tree, so the agent and the human edit side by side.

## How the pieces fit

- **HyperFrames** ([github](https://github.com/heygen-com/hyperframes)) — the rendering engine. HTML-native, agent-first, deterministic. Ships with a 50+ block catalog and an in-browser `<hyperframes-player>`.
- **Mastra Harness** ([docs](https://mastra.ai)) — the agent runtime. Bundles state, storage, memory, modes, workspace skills, tools, and an event bus into one cohesive class.
- **Vercel AI SDK** + **OpenAI** — the model interface (`o4-mini` with reasoning, swappable to `gpt-5.1`).
- **Next.js 15** (App Router) — the shell, SSE streaming, server actions.
- **Postgres (Neon) + Prisma · Clerk · Vercel Blob** — persistence, auth, asset storage.

## Repo layout

```
vibeframes/
├── docs/           the project's spine — read this first
├── experiments/    standalone spikes (timeline libs, hyperframes player)
├── assets/         diagrams, screenshots, design refs
└── (app/ lib/ etc. land at the root once docs are in place)
```

## License

TBD. Likely MIT.
