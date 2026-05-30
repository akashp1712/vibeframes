# LinkedIn Post #2 — "Smallest possible Mastra Harness loop, end-to-end"

**Gating moment**: M9 closeout — harness loop + LibSQL persistence working, runs locally with just an OpenAI key.

**Source material**: `docs/lld/lld-03-harness-wiring.md`, `docs/lld/lld-04-sse-protocol.md`, `docs/journal/session-11.md`.

---

## Draft 1 — long form (carousel-friendly)

> 8 weeks ago I wrote 8 design docs before shipping a single line of code.
>
> Yesterday I closed M9: the *smallest possible* Mastra Harness loop, end to end. Chat in. Tool call. Composition mutates. SSE streams back. Refresh — your timeline is still there.
>
> **What "end-to-end" actually means here:**
>
> 1. `POST /api/chat` → `getVibeFramesHarness(projectId)` (cached per pid).
> 2. `harness.selectOrCreateThread()` → LibSQL row.
> 3. `harness.subscribe(event => emit SSE)` → custom envelope with `runId`, monotonic `seq`, filtered noise events.
> 4. `harness.sendMessage({ content })` → the Director agent (gpt-4o-mini) starts streaming.
> 5. Tool call: `add-clip({ trackId, startMs, durationMs, html })` — pure mutation on a Zod-validated Composition tree.
> 6. `setComposition()` writes-through to `.data/compositions/<pid>.json`.
> 7. `compositionHtml` flows back to the React client via the SSE pipe.
> 8. The Studio preview iframe re-renders with Tailwind + GSAP.
>
> **The five things that surprised me building it:**
>
> ✦ **Mastra has `Harness`, not just `streamText`.** I started with AI SDK's `streamText` because every tutorial uses it. That's a wrapper around one LLM call. A *Harness* is an agent runtime — threads, memory, modes, tools, skills, event bus, permission system. Same primitives HeyGen Studio uses. Once I swapped, half my plumbing deleted itself.
>
> ✦ **YOLO mode is a real architectural decision.** Mastra defaults to "ask before tool call". Vercel functions can't pause for a UI confirmation. So `state.yolo = true` — tools auto-approve. The day we move to durable workflows (Temporal/Inngest), we flip it back.
>
> ✦ **Tool events aren't on the SSE wire by default.** I burned an evening watching empty events. The fix: filter the *noise* events (`display_state_changed`, `tool_input_delta`, `tool_input_start/end`) — everything else IS already on the bus.
>
> ✦ **The skill file is your top quality lever.** The agent's HTML output quality lives almost entirely in `skills/hyperframes/skill.md` — render contract, typography ramp, timing heuristics, animation strategy. Spend 80% of your skill-tuning time here, not on the prompt.
>
> ✦ **Persistence wants two stores, not one.** Mastra's LibSQL holds threads + messages. Compositions (big HTML blobs) get their own write-through file store, hydrated on first read. Keeping them apart avoids growing every thread row, and tools stay sync-flavoured.
>
> **Zero-config promise**: clone, set `OPENAI_API_KEY`, `pnpm dev`. Local SQLite is created on first prompt. Refresh — composition's still there. Want serverless? Point `VIBEFRAMES_DB_URL` at Turso.
>
> Next: M10. The real editor. Block registry, timeline lib decision, full tool catalog, Kibo chat UI.
>
> Code + docs (Apache 2.0): github.com/akashp1712/vibeframes

---

## Draft 2 — tight version (single post)

> M9 done. The smallest possible Mastra Harness loop, end-to-end, refresh-survivable.
>
> What clicked:
>
> 1. **Drop `streamText` for `Harness`.** Threads, memory, modes, tools, skills, event bus — all the primitives mc-studio uses. Half my plumbing deleted itself.
>
> 2. **YOLO mode is intentional.** Vercel functions can't pause for tool approval. `state.yolo = true` skips the gate. The day I move to durable workflows, I flip it.
>
> 3. **Filter noise events.** Mastra emits `display_state_changed` / `tool_input_*` constantly. Filter those at the SSE writer — keep `tool_start`, `tool_end`, `text_delta`, `message_*`, `run.*`.
>
> 4. **Skill files > prompt tweaks.** 80% of HTML output quality lives in `skills/hyperframes/skill.md`, not in the system prompt.
>
> 5. **Two stores, not one.** LibSQL for threads + messages. File-backed JSON for the composition (write-through, hydrate-on-read). Composition blobs don't belong in thread rows.
>
> Zero-config: clone → set `OPENAI_API_KEY` → `pnpm dev`. Local SQLite is created on first prompt. Refresh — your timeline's still there. Swap `VIBEFRAMES_DB_URL` to Turso for serverless.
>
> Next: M10 — the real editor.
>
> Code + 11 design docs + LLDs: github.com/akashp1712/vibeframes

---

## Asset checklist

- [ ] Loom (45–60s): blank studio → "Add a Vercel intro, 6s" → clip appears → "Add a CTA at the end" → second clip appears → refresh → both still there.
- [ ] Screenshot: chat panel with activity timeline + ephemeral status.
- [ ] Screenshot: `lld-03` persistence diagram (the ASCII one).
- [ ] Tag: @MastraAI, @HeyGen (for HyperFrames), @TursoDB.

## Comment seed (post yourself 5 min later)

> The next 5 minutes are about M10 — the real editor. Block registry, timeline lib decision (`@xzdarcy/react-timeline-editor` vs custom dnd-kit), full tool catalog, Kibo chat UI. If anyone has war stories from building a timeline editor in 2025, I want to hear them.
