# LLD-05 · Harness Architecture — Deep Dive

Status: Implemented (M9)
Last updated: 2026-05-30
Related: LLD-03 (wiring), LLD-04 (SSE protocol)

## TL;DR

The **VibeFrames Harness** is a stateful, single-instance-per-project Mastra Agent runtime. It owns:

- A **typed state** (Zod-validated, persisted via Memory)
- One or more **Modes** (each a distinct agent persona + tool set + skill scope)
- A set of **Tools** (capability surface for the LLM)
- A **Workspace** of **Skills** (markdown knowledge docs the LLM can summon)
- A **Services** layer (dependency injection for tools)
- An **Event Bus** (everything the agent does emits structured events)

Output quality depends on **three levers** — in order of impact:

1. **Skill files** (`skill.md`) — what the LLM knows about the domain
2. **Tools** (capability surface) — what the LLM can do
3. **Prompt** (system message) — how the LLM is oriented

LLM choice is a distant fourth. Spend time on 1–3.

---

## The big picture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER (browser)                                  │
│                                                                              │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐              │
│  │  ChatPanel     │    │  PreviewPanel  │    │  CodePanel     │              │
│  │  (Suggested    │    │  (GSAP-driven  │    │  (Live HTML)   │              │
│  │   prompts +    │    │   iframe       │    │                │              │
│  │   tool cards)  │    │   player)      │    │                │              │
│  └────────┬───────┘    └────────┬───────┘    └────────┬───────┘              │
│           │                     │                     │                      │
│           ▼                     ▼                     ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │       useHarnessChat()   ←—— consumes SSE   ——→   useComposition()   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ POST /api/chat (SSE)
                                       │ Envelope { v, runId, seq, type, payload }
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Next.js Edge route (/api/chat)                         │
│                                                                              │
│   • getVibeFramesHarness(projectId)  ← per-project cached singleton          │
│   • harness.selectOrCreateThread()                                           │
│   • harness.subscribe(event => writeEvent(envelope))                         │
│   • harness.sendMessage({ content })                                         │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
╔══════════════════════════════════════════════════════════════════════════════╗
║                       THE VIBEFRAMES HARNESS                                 ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  STATE  (Zod-validated, persisted in MastraCompositeStore)             │  ║
║  │  ─────                                                                 │  ║
║  │   projectId: string                                                    │  ║
║  │   currentRunId: string | null                                          │  ║
║  │   yolo: boolean   ← auto-approve all tool calls (true for VibeFrames)  │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  MODES  (each is an Agent personality + tool subset + skill scope)     │  ║
║  │  ─────                                                                 │  ║
║  │                                                                        │  ║
║  │  ┌──────────────────────────────────────────────────────────────────┐  │  ║
║  │  │  director  (current sole mode)                                   │  │  ║
║  │  │  ──────────                                                      │  │  ║
║  │  │   model:        gpt-4o-mini   (via @ai-sdk/openai)               │  │  ║
║  │  │   instructions: buildDirectorPrompt()                            │  │  ║
║  │  │   tools:        [ add-clip, update-clip, remove-clip,            │  │  ║
║  │  │                   get-composition, get-block-schemas ]           │  │  ║
║  │  └──────────────────────────────────────────────────────────────────┘  │  ║
║  │                                                                        │  ║
║  │  ─ FUTURE ─                                                            │  ║
║  │  ┌──────────────────────────────────────────────────────────────────┐  │  ║
║  │  │  editor   (precise nudge/trim/swap)                              │  │  ║
║  │  │  dop      (style/look transfer, palette generation)              │  │  ║
║  │  │  brand    (validates against BrandKit, suggests fixes)           │  │  ║
║  │  └──────────────────────────────────────────────────────────────────┘  │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  TOOLS  (the LLM's hands — each is createTool() from @mastra/core)     │  ║
║  │  ─────                                                                 │  ║
║  │                                                                        │  ║
║  │   add-clip          → mutates composition store, returns HTML+counts   │  ║
║  │   update-clip       → patches clip html/timing/track                   │  ║
║  │   remove-clip       → deletes clip; auto-removes empty tracks          │  ║
║  │   get-composition   → introspect current state                         │  ║
║  │   get-block-schemas → fetch Tailwind block templates from registry     │  ║
║  │                                                                        │  ║
║  │  ─ Built-in (Mastra) ─ DISABLED in our config ─                        │  ║
║  │   task_write, task_check, ask_user, submit_plan                        │  ║
║  │                                                                        │  ║
║  │  ─ FUTURE ─                                                            │  ║
║  │   upload-asset, generate-image, generate-voice,                        │  ║
║  │   get-brand, apply-brand-styles, validate-clip                         │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  WORKSPACE  (Mastra Workspace — ingests skill.md files)                │  ║
║  │  ─────────                                                             │  ║
║  │                                                                        │  ║
║  │   src/harness/skills/                                                  │  ║
║  │   └── hyperframes/                                                     │  ║
║  │       └── skill.md   ← stage dims, typography ramps, layering,         │  ║
║  │                        timing heuristics, color palettes,              │  ║
║  │                        examples, animation contract                    │  ║
║  │                                                                        │  ║
║  │  ─ FUTURE skills/ ─                                                    │  ║
║  │   gsap/skill.md           — advanced motion recipes                    │  ║
║  │   lottie/skill.md         — embedding Lottie animations                │  ║
║  │   transitions/skill.md    — clip-to-clip transitions (wipe, fade)     │  ║
║  │   brand-compliance/       — per-project brand kits                     │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  SERVICES  (dependency injection for tools)                            │  ║
║  │  ────────                                                              │  ║
║  │                                                                        │  ║
║  │   clipRegistry: ClipRegistryService                                    │  ║
║  │     ├ getBlockSchemas() → HyperFramesBlock[]                           │  ║
║  │     │   [hero-title, lower-third, split-screen]                        │  ║
║  │                                                                        │  ║
║  │  ─ FUTURE ─                                                            │  ║
║  │   assetLibrary: AssetLibraryService    (upload + list user assets)     │  ║
║  │   brandValidator: BrandValidatorService (check HTML against BrandKit)  │  ║
║  │   imageGen: ImageGenerationService     (Vercel AI Gateway / FAL)       │  ║
║  │   voiceGen: VoiceGenerationService     (ElevenLabs)                    │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  MEMORY  (Mastra Memory backed by CompositeStore)                      │  ║
║  │  ──────                                                                │  ║
║  │                                                                        │  ║
║  │   threads:   per-(harnessId, resourceId) conversation threads          │  ║
║  │   messages:  full history with tool_call + tool_result parts           │  ║
║  │   state:     persisted state snapshot per thread                       │  ║
║  │                                                                        │  ║
║  │   Storage:                                                             │  ║
║  │     M9    → InMemoryStore   (process-local, lost on cold start)        │  ║
║  │     M10+  → LibSQL or Postgres+Drizzle                                 │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │  EVENT BUS  (the heartbeat — every action emits a typed event)         │  ║
║  │  ─────────                                                             │  ║
║  │                                                                        │  ║
║  │   run.start  →  agent_start  →  text_delta…  →  tool_start  →          │  ║
║  │     tool_end  →  text_delta…  →  message_end  →  agent_end  →          │  ║
║  │   run.complete                                                         │  ║
║  │                                                                        │  ║
║  │   Filtered noise (server-side): display_state_changed,                 │  ║
║  │                                  tool_input_{start,delta,end}          │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Data flow on a single message

```
User: "Build a 6-second Vercel intro"
  │
  ▼
ChatPanel.handleSubmit()
  │  POST /api/chat { messages, projectId }
  ▼
/api/chat route handler
  │  getVibeFramesHarness("vercel-intro")   ← cached singleton
  │  await harness.selectOrCreateThread()
  │  open SSE stream
  │  harness.subscribe(emitEvent)
  │  emit("run.start", { content })
  │  ⟶ harness.sendMessage({ content })
  │
  │  ┌─── INSIDE THE HARNESS ───────────────────────────────────────────┐
  │  │                                                                  │
  │  │  1. Active mode = "director"                                     │
  │  │  2. Mode runs:                                                   │
  │  │       buildDirectorPrompt() + state + threadHistory  ──►  LLM    │
  │  │                                                                  │
  │  │  3. LLM streams text:  "I'll build that intro…"                  │
  │  │      └─► emit("text_delta", { textDelta })                       │
  │  │                                                                  │
  │  │  4. LLM decides to call `get-block-schemas`                      │
  │  │      └─► emit("tool_start", { toolCallId, toolName, args })      │
  │  │      └─► tool.execute() ⟶ services.clipRegistry.getBlockSchemas()│
  │  │      └─► emit("tool_end", { toolCallId, result })                │
  │  │                                                                  │
  │  │  5. LLM decides to call `add-clip` (×3)                          │
  │  │      └─► for each:                                               │
  │  │           tool_start ─► mutate composition store ─► tool_end     │
  │  │           each tool_end's result.compositionHtml updates UI      │
  │  │                                                                  │
  │  │  6. LLM emits final message: "Done. Added 3 clips on 3 tracks."  │
  │  │      └─► emit("message_end", { message })                        │
  │  │  7. emit("agent_end")                                            │
  │  │                                                                  │
  │  └──────────────────────────────────────────────────────────────────┘
  │
  │  emit("run.complete")
  │  close SSE stream
  ▼
useHarnessChat (browser)
  │  switch(event.type)
  │    text_delta   → append to assistant message; status = "streaming"
  │    tool_start   → push ToolCard(state="calling"); status = "calling-tool"
  │    tool_end     → update ToolCard(state="result", durationMs);
  │                   useComposition() extracts compositionHtml from result
  │    message_end  → replace final message text
  │    run.complete → status = "done"
  ▼
PreviewPanel re-renders iframe with new HTML
  │  GSAP timeline rebuilt: fromTo(opacity:0→1) per clip, in seq
  │  Player starts auto-play loop
```

---

## Why each layer matters (priority of investment)

### 1. Skill files — **80% of output quality**

The LLM is generic; the skill is what makes it a *HyperFrames composer*. Every guideline in `skill.md` directly shapes:

- What HTML patterns the LLM tries (typography ramp, color palette, layering)
- What it avoids (script tags, fades, edge text)
- How it sequences calls (background first, hero second, supporting third)

**Investment**: ~1 hour of writing skill.md = a 10× quality jump that no LLM upgrade can match.

### 2. Tools — **15% of quality, 100% of capability**

Tools define the **action space**. Without `add-clip`, the LLM can describe a video but not build one. Each tool we add expands what the user can ask for. Each tool we improve (better schemas, richer return values) tightens the agent's introspection loop.

**High-leverage tools to add next**:
- `validate-clip` — let the agent check its own HTML against the skill
- `preview-clip` — render a single clip server-side and return a screenshot
- `list-assets` — surface uploaded media
- `get-brand` — surface the project's brand kit

### 3. Prompt — **5% of quality**

The prompt orients the agent ("you are a Director, your workflow is…"). It is **not** where guidance should live — that goes in the skill, which is summon-able and composable. Keep prompts terse.

### 4. LLM choice — small marginal gains

`gpt-4o-mini` vs `gpt-4o` vs `claude-3.5-sonnet` differs ~10–20% on output quality for well-skilled tasks. Worth tuning later; not the bottleneck today.

---

## Skill loading flow (how the skill actually reaches the LLM)

```
1. Harness boot
   └─► Workspace = { skills: [SKILLS_PATH] }
       └─► Walk dir, find all skill.md files
           └─► Parse YAML frontmatter
               └─► Register skill in workspace registry by name

2. Agent run (per message)
   └─► The LLM sees `skill` as a built-in tool (Mastra-provided)
       └─► skill({ name: "hyperframes" }) returns the full markdown
           └─► LLM ingests it as context for the rest of the turn

3. Future enhancement
   └─► Pre-inject skill into the system prompt when the mode is bound to it
       (avoids the LLM needing to "remember" to call skill())
```

**Today**: the LLM has to know to call `skill({ name: "hyperframes" })` itself. We rely on the prompt nudging it.

**Improvement (M10 candidate)**: have the Director mode auto-inject the hyperframes skill content into its instructions at boot. Then it's always present without a tool call.

---

## Tool design principles (used by every tool here)

Each tool follows this pattern:

```ts
createTool({
  id: "kebab-case-name",
  description: "Single sentence + key return value hint",
  inputSchema: z.object({ … }),   // Zod — auto-converted to JSON schema for the LLM
  execute: async (args) => {
    // 1. Read current state via stores/services
    // 2. Apply a pure mutation
    // 3. Persist the new state
    // 4. Return a structured result that the UI can consume
    return {
      // canonical fields the UI looks for:
      compositionHtml: string,   // updated render
      clipCount: number,
      trackCount: number,
      // tool-specific:
      clipId, trackId, …
    };
  },
});
```

Three rules:

1. **Return enough for the UI to update without another tool call**. The `tool_end` event carries `compositionHtml`, so the preview iframe updates instantly. No "fetch latest" round-trip.
2. **Use rich descriptions in Zod**. The LLM reads `.describe()` strings to decide how to fill each argument.
3. **Tools are pure-ish wrappers around mutations**. The actual logic (`addClip`, `removeClip`) lives in `mutations.ts` and is independently testable.

---

## Mode design principles

A Mode is **(agent persona) × (tool subset) × (skill scope)**. Switching modes is how you give the same harness different personalities for different jobs.

Why we have **one mode (Director) today**:
- M9 scope is "agent that composes from scratch"
- Splitting modes prematurely fragments the system prompt

Why we'll add **Editor next**:
- Director is great at "build me X" but verbose for "shift clip 2 left by 200ms"
- Editor would have a smaller tool set + a prompt tuned for surgical changes
- Same memory, same state — just a different lens

---

## The Event Bus — why we own the protocol

Mastra's harness emits a rich stream of typed events. We could let AI SDK's `useChat` parse them, but we lose:

- **Tool start/end visibility** — `useChat` only surfaces tool calls in the message structure, not as separate observable events
- **Skill loading events** — `useChat` has no concept
- **`tool_approval_required`** — future human-in-the-loop gate
- **Sub-agent lifecycles** — future nested-agent workflows

By owning the SSE envelope (LLD-04) we keep all of this open.

---

## Persistence story (M9 vs future)

| Concern                  | M9                          | M10+ target                  |
|-------------------------|-----------------------------|------------------------------|
| Composition store       | In-memory `Map<projectId>`  | Postgres + Drizzle           |
| Mastra threads/messages | `InMemoryStore`             | LibSQL or Postgres           |
| Harness state           | `InMemoryStore`             | Same as above                |
| User assets             | n/a                         | Vercel Blob                  |
| Brand kits              | n/a                         | Postgres column on Project   |

**M9 limitation**: cold start drops everything. Acceptable while we iterate on UX.

---

## Where to look in the code

| Concept            | File                                                              |
|-------------------|-------------------------------------------------------------------|
| Harness boot      | `src/harness/index.ts`                                            |
| State schema      | `src/harness/state.ts`                                            |
| Director mode     | `src/harness/mode.ts`                                             |
| Director prompt   | `src/harness/prompts/composer.ts`                                 |
| Tool factories    | `src/harness/tools/{add,update,remove,get}-clip.ts`               |
| Block registry    | `src/harness/services/clip-registry.service.ts`                   |
| Service types     | `src/harness/services/types.ts`                                   |
| Skill files       | `src/harness/skills/{hyperframes,blocks,social-overlays,effects,transitions}/skill.md` |
| Composition model | `src/harness/types.ts`, `mutations.ts`, `serialize.ts`            |
| SSE protocol      | `src/protocol/sse-writer.ts`, `src/protocol/events.ts`            |
| SSE route         | `src/app/api/chat/route.ts`                                       |
| Client hook       | `src/harness/use-harness-chat.ts`                                 |

---

## Open questions / things to revisit

1. **Auto-injection vs on-demand skills** — should hyperframes always be in the prompt, or summoned via the `skill` tool? Currently: prompt nudges the agent to call `skill`. Better: pre-inject.
2. **Tool composition** — should `add-clip` accept a `blockId` parameter that pre-fills HTML from the registry? Currently the agent has to call `get-block-schemas` then write HTML by hand.
3. **Multi-step planning** — for a "10-scene product demo", should we add a `plan-composition` tool that generates a high-level outline before per-clip work?
4. **Skill versioning** — if a project upgrades to a new skill version, how do we handle existing conversations referencing the old one?

These are not blockers — flagged for future LLDs/ADRs.
