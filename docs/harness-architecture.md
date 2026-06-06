# VibeFrames Architecture — single source of truth

> **One stop for "where does X live?" and "how do I add Y?"**
> When something feels confusing, this doc is wrong — fix it here, not
> in your head.
>
> Last updated: 2026-06-06

## TL;DR

```
   user prompt
        │
        ▼
   /api/chat ──► getVibeFramesHarness(projectId)
                       │
                       ▼
                 ┌─────────────────────────────────────────────────┐
                 │    Mastra Harness (one per project)             │
                 │                                                  │
                 │   ┌──────────────────────────────────────────┐  │
                 │   │ STATE        VibeFramesState (Zod)       │  │
                 │   │   brief, storyboard, validationReport    │  │
                 │   └──────────────────────────────────────────┘  │
                 │   ┌──────────────────────────────────────────┐  │
                 │   │ MEMORY + STORAGE   LibSQL                │  │
                 │   │   threads, messages, persisted state     │  │
                 │   └──────────────────────────────────────────┘  │
                 │   ┌──────────────────────────────────────────┐  │
                 │   │ DIRECTOR     ONE Agent                   │  │
                 │   │   model:        gpt-4o-mini              │  │
                 │   │   prompt:       state-aware (phase/state)│  │
                 │   │   tools:        all 11 (state-guarded)   │  │
                 │   │   skills:       workflow, brief,         │  │
                 │   │                 storyboard, design,      │  │
                 │   │                 validate                 │  │
                 │   └──────────────────────────────────────────┘  │
                 └─────────────────────────────────────────────────┘
                       │
                       │  one user turn = full pipeline
                       │  brief → storyboard → compose → validate
                       ▼
                 SSE stream back to UI
```

## The Pipeline

```
   ┌────────┐    ┌────────────┐    ┌─────────┐    ┌──────────┐
   │ BRIEF  ├───►│ STORYBOARD ├───►│ COMPOSE ├───►│ VALIDATE │
   └────────┘    └────────────┘    └─────────┘    └──────────┘
   intent        plan beats        emit clips     check rules
```

| Phase      | Reads                | Writes                   | Tools                                                                 |
|------------|----------------------|--------------------------|-----------------------------------------------------------------------|
| Brief      | user prompt          | `state.brief`            | `commit-brief`                                                        |
| Storyboard | `state.brief`        | `state.storyboard`       | `list-blocks`, `propose-storyboard`, `revise-beat`, `commit-storyboard` |
| Compose    | `state.storyboard`   | composition tree (LibSQL)| `get-storyboard`, `create-beat`, `revise-beat`, `rebuild-beat`, `finish-compose` |
| Validate   | storyboard + composition | `state.validationReport` | `check-storyboard`                                                |

All four phases run **inside one user turn**. The agent reads the workflow skill on turn start, then chains commit-brief → commit-storyboard → create-beat × N → finish-compose → check-storyboard. Skills load once into the prompt and stay in cache for every subsequent step.

## Repo map

```
   src/harness/
   ├── index.ts                  factory (getVibeFramesHarness) + barrel
   ├── state.ts                  Zod schemas: Brief, Beat, Storyboard, etc.
   ├── config.ts                 HARNESS_CONFIG (model defaults, fps, resolution)
   ├── storage.ts                LibSQL store factory
   ├── brand-registry.ts         canonical brand colors (Linear, Stripe, …)
   │
   ├── director/                 the single agent
   │   ├── agent.ts              Mastra Agent + Mode wiring
   │   ├── prompt.ts             state-aware system prompt
   │   ├── phase.ts              phase derivation (used by prompt)
   │   ├── tools.ts              tool registry (re-exports from tools/)
   │   └── skills/               markdown guides loaded into Agent workspace
   │       ├── workflow/skill.md     ◄── meta-skill: read first every turn
   │       ├── brief/skill.md         how to fill a Brief
   │       ├── storyboard/skill.md    concept-first beat planning
   │       ├── design/skill.md        block variety, palette, overlays
   │       └── validate/skill.md      how to interpret the report
   │
   ├── composition/              the artifact we build
   │   ├── schema.ts             Clip / Track / Composition (Zod)
   │   ├── mutations.ts          pure ops (addClip, removeClip, …)
   │   ├── store.ts              disk-backed per-project store (LibSQL+JSON)
   │   ├── serialize.ts          jsonTree → HyperFrames HTML
   │   ├── translator.ts         beat → clip mutations (the heart of Compose)
   │   ├── validation-rules.ts   pure rule fns (beat-not-built, etc.)
   │   └── __tests__/
   │
   ├── services/                 long-lived registries
   │   ├── clip-registry.service.ts        ◄── BLOCK CATALOG (data)
   │   ├── transition-registry.service.ts
   │   ├── types.ts                         shared types
   │   └── index.ts
   │
   ├── tools/                    tools the agent can call
   │   ├── commit-brief.ts       writes state.brief
   │   ├── storyboard-tools.ts   propose/commit/revise storyboard
   │   ├── compose-tools.ts      create/rebuild/revise beat, finish-compose
   │   ├── check-storyboard.ts   runs validation rules → report
   │   ├── get-composition.ts    read-only inspection
   │   ├── list-blocks.ts        slim catalog (id+description, no HTML)
   │   ├── get-block-schemas.ts  full catalog (with HTML — used by translator only)
   │   ├── get-transition-schemas.ts
   │   ├── index.ts              barrel for legacy callers
   │   └── __tests__/
   │
   ├── tools-internal/           low-level mutation primitives
   │   ├── add-clip.ts           NOT exposed to the agent
   │   ├── update-clip.ts        called only by the translator
   │   ├── remove-clip.ts
   │   ├── add-transition.ts
   │   └── __tests__/
   │
   ├── react/                    client hooks
   │   ├── use-composition.ts    derive ClipInfo[] + html from messages
   │   └── use-harness-chat.ts   POST /api/chat, stream SSE
   │
   ├── __e2e__/
   │   └── pipeline.live.test.ts opt-in live LLM e2e (pnpm test:e2e)
   └── __tests__/                state, brand-registry, e2e
```

## State (Zod)

`src/harness/state.ts` is the single shape contract. Every tool that mutates writes through this schema.

```ts
VibeFramesState = {
  projectId:         string
  yolo:              boolean = true
  currentRunId?:     string
  brief:             Brief | null               ← set by commit-brief
  storyboard:        Storyboard | null          ← set by commit-storyboard
  validationReport:  ValidationReport | null    ← set by check-storyboard
}

Brief = {
  message:    string ≥ 8 chars
  arc:        "problem-solution" | "reveal" | "demonstration" | "vibe" | "comparison"
  audience:   string ≥ 3 chars
  format:     "landscape" | "portrait" | "square"
  durationMs: int 2_000..120_000        ← 2s floor (was 5s) for short clips
  narration:  "full" | "minimal" | "none"
  styleNotes: string?
  brand: { name?, primaryColor?, accentColor?, fontFamily? }
}

Beat = {
  index, concept, shotType, cameraMove, techniques[≥2],
  blockHints[], voCue, durationMs, built, clipIds[]
}

Storyboard = { rhythm: "fast"|"moderate"|"slow"|"arc",  beats: Beat[2..20] }

ValidationReport = { ranAt, issues[], pass, attempts }
```

## How a user prompt flows

```
   1. Browser POSTs { messages, data:{ projectId } } to /api/chat
   2. /api/chat:
        - getVibeFramesHarness(projectId) → cached harness
        - harness.subscribe(event ⇒ writeSSE(event))     # stream events
        - harness.sendMessage({ content })               # fire-and-forget loop

   3. Director's instructions are RE-RENDERED with current state
      every LLM call (state-aware prompt — phase + summary at top).

   4. The agent reads workflow + relevant skill, then calls tools:
         skill(workflow), skill(brief)
         commit-brief({...})            ← state.brief = Brief
         skill(storyboard)?, list-blocks
         commit-storyboard({...})       ← state.storyboard = Storyboard
         create-beat({index:1})         ← composition mutates, beat.built=true
         create-beat({index:2})
         …
         finish-compose()
         check-storyboard()             ← state.validationReport = Report
         (final 2-sentence reply to user)

   5. Each tool result includes compositionHtml when relevant.
      use-composition.ts in the UI scans the message stream for the
      latest compositionHtml and re-renders the iframe preview. The
      preview script in components/studio/preview/panel.tsx parses
      .clip elements, builds a GSAP timeline, plays it on loop.
```

## Tools — what each one does

| Tool                  | When                | Reads                 | Writes                            |
|-----------------------|---------------------|-----------------------|-----------------------------------|
| `commit-brief`        | once per turn       | input                 | `state.brief` (sanitized)         |
| `list-blocks`         | when planning beats | catalog               | none                              |
| `propose-storyboard`  | rare, drafting      | input + brief         | none                              |
| `commit-storyboard`   | once per turn       | input + brief         | `state.storyboard`                |
| `revise-beat`         | edit a beat         | input + storyboard    | `state.storyboard`                |
| `get-storyboard`      | inspect             | state                 | none                              |
| `create-beat`         | once per beat       | beat + brief + catalog| composition tree, `beat.built=true` |
| `rebuild-beat`        | retry on fail       | same                  | composition tree (drop+re-emit)   |
| `finish-compose`      | after all beats     | storyboard            | none (gate-check only)            |
| `check-storyboard`    | last in pipeline    | storyboard + composition | `state.validationReport`       |
| `get-composition`     | inspect             | composition           | none                              |

`add-clip`, `update-clip`, `remove-clip` live in `tools-internal/` — the agent NEVER sees them. Only `create-beat` / `rebuild-beat` invoke them via the translator.

## Catalog vs skills — what each is for

Two things easily confused. They are not the same.

```
   ┌─────────────────────────────────────────────────────────────────┐
   │                                                                 │
   │   THE CATALOG  (the thing — block defs, code)                   │
   │   ─────────────                                                 │
   │   Lives in:  src/harness/services/clip-registry.service.ts      │
   │   Shape:     21 blocks, each with                               │
   │               id, name, category, description,                  │
   │               template (HTML with {{vars}}), vars[]             │
   │   Purpose:   the actual building material for a clip            │
   │                                                                 │
   │   ◄── Add or edit a block? Edit THIS file. That's it.           │
   │                                                                 │
   │                                                                 │
   │   THE SKILLS  (markdown — how to PICK a block)                  │
   │   ────────────                                                  │
   │   Live in:  src/harness/director/skills/*/skill.md              │
   │   Shape:    plain markdown guides                               │
   │              storyboard.md → "use stats-callout for metrics"    │
   │              design.md     → "vary blocks across beats"         │
   │   Purpose:  give the agent rules for choosing IDs from the      │
   │             catalog. Skills know block ids by NAME only.        │
   │             They contain ZERO HTML and ZERO var defs.           │
   │                                                                 │
   │   ◄── Adding a block does NOT require touching any skill.       │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘
```

Quick proof:
- Delete the catalog → typecheck breaks, translator has nothing to render, the agent has zero blocks to pick from.
- Delete a skill → typecheck still passes, the agent still works (it reads `list-blocks` at runtime); selection just gets sloppier without the variety advice.

The registry is the bones; the skills are the bedside manner.

## How the catalog actually flows through a turn

Two callers read the registry — at different times, with different views:

```
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                  │
   │  1.  list-blocks tool (planning time, agent-facing)              │
   │      ─────────────────                                           │
   │      Director calls list-blocks while drafting the storyboard.   │
   │                                                                  │
   │      services.clipRegistry.getBlockSchemas()                     │
   │           │                                                      │
   │           ▼   strip template HTML, return                        │
   │           id, name, category, description, varNames              │
   │                                                                  │
   │      Agent uses this to pick blockHints per beat.                │
   │      ~80% smaller payload than the full catalog.                 │
   │                                                                  │
   │                                                                  │
   │  2.  translator.ts (build time, server-side)                     │
   │      ─────────────                                               │
   │      create-beat → translator.translateBeat(...)                 │
   │                                                                  │
   │      services.clipRegistry.getBlockSchemas()                     │
   │           │                                                      │
   │           ▼   FULL view this time                                │
   │           id, ..., template (HTML), vars[]                       │
   │                                                                  │
   │      pickPrimaryBlock(beat, catalog, storyboard)                 │
   │           │                                                      │
   │           ▼                                                      │
   │      varsForBlock(block, beat, brief)                            │
   │           │                                                      │
   │           ▼                                                      │
   │      renderBlock(block, vars) → final HTML                       │
   │           │                                                      │
   │           ▼                                                      │
   │      addClip(...) → composition tree                             │
   │                                                                  │
   └──────────────────────────────────────────────────────────────────┘
```

End-to-end, what's read where:

```
   ┌──────────────────────────────┬───────────────────────────────────┐
   │ Stage                        │ Reads                             │
   ├──────────────────────────────┼───────────────────────────────────┤
   │ Director plans storyboard    │ workflow + storyboard + design     │
   │                              │ skills (markdown rules)            │
   │ Director picks blockHints    │ list-blocks tool → slim catalog    │
   │ Director commits storyboard  │ —                                 │
   │ Director calls create-beat   │ —                                 │
   │ Translator emits clips       │ services.clipRegistry directly →   │
   │                              │ FULL catalog with template HTML    │
   └──────────────────────────────┴───────────────────────────────────┘
```

The skills never touch HTML. The translator never reads markdown. They never overlap; they share only block ids as a referent.

## How the translator picks blocks

`src/harness/composition/translator.ts` is the heart of Compose. Inputs:
1. `beat` (the storyboard's spec)
2. `brief` (for brand info + style notes)
3. `catalog` (full block defs with HTML templates)

The translator emits 2–3 clips per beat:

```
   Track 0  background-fill   (always)   bgClass picked by styleNotes;
                                          brand-color accent line on bottom edge
   Track 1  picked primary    (always)   from blockHints OR concept-keyword
                                          fallback OR shotType fallback
   Track 2  optional overlay  (sometimes) when blockHints includes a
                                          social/lower-third/effect block
```

Block selection priority:
1. **`beat.blockHints`** — if the agent specified an id that's in the catalog and isn't `background-fill`, use it.
2. **Concept keywords** — `concept` mentions "stat"/"metric"/"%" → `stats-callout`; "quote"/"testimonial" → `quote-pull`; "cta"/"call to action" → `cta-button`; etc.
3. **Position** — first beat → `hero-title`, last beat → `end-card` (regardless of shotType).
4. **Shot type** — `extreme-close` → stats; `medium`/`wide` → `split-screen`; etc.

Vars come from `brief.brand.name`, `brief.message` (distilled by `headlineFromMessage`), or `beat.voCue`. We **never** use the raw `beat.concept` text as headline copy — that's internal storyboard prose.

## How to add a new block

```
   1. Edit src/harness/services/clip-registry.service.ts
      - Add a new entry to the BLOCKS array:
        {
          id:           "kebab-case-id",
          name:         "Human-readable name",
          category:     "background" | "title" | "scene" | "stats"
                          | "quote" | "cta" | "end" | "lower-third"
                          | "social" | "follow" | "effect-overlay",
          kind:         "unit" | "composition",
          description:  "When to use it (1-2 sentences for the agent).",
          template:     `<div class="...">{{varName}}</div>`,
          vars: [
            { name: "varName", description: "...", required: true|false,
              defaultValue?: "..." },
          ],
        }

   2. (Optional) Update director/skills/design/skill.md
      Only if the new block changes a categorical rule (e.g. a new
      effect-overlay type, or a new "use this for opener" pattern).
      Most blocks don't need this — list-blocks shows the agent the
      description at runtime.

   3. (Optional) Update src/harness/composition/translator.ts
      Two cases:
      a) The block needs custom var rendering (e.g. number extraction,
         brand-aware copy): add a switch case in varsForBlock().
      b) The block deserves a position-aware default (e.g. always
         pick this for "social proof" beats): add a case in
         pickPrimaryBlock().

   4. (Optional) Add a validation rule
      If the block has shape constraints (e.g. "must appear on
      track 3+"), add a pure rule to
      src/harness/composition/validation-rules.ts and include it in
      runAllRules(). Severity = "error" blocks shipping; "warning"
      ships with a note.

   5. Test:
      pnpm test src/harness/composition/__tests__/translator.test.ts
```

**You never touch a skill or a prompt to add a block.** The agent reads `list-blocks` at runtime and the description tells it when to reach.

## How to add a new validation rule

```
   1. Edit src/harness/composition/validation-rules.ts
      - Add a pure function: (ctx) => ValidationIssue[]
      - Add it to allRules[].

   2. Update director/skills/validate/skill.md
      Add the rule's name + meaning to the "Rule glossary" table so
      the agent can decide retry-vs-ship.

   3. Test:
      pnpm test src/harness/composition/__tests__/validation-rules.test.ts
```

## How to add a new skill (markdown guide)

```
   1. Create src/harness/director/skills/<name>/skill.md with
      frontmatter:
        ---
        name: <name>
        description: <one-line — used by Mastra to surface to agent>
        ---
        # ... content ...

   2. (Optional) Reference it from director/prompt.ts so the agent
      knows it exists. Most skills auto-surface via Mastra's skill
      tool — only mention them up top if they're critical to load
      first (workflow is the only one in that category).

   3. No code change. Skills are loaded via the
      Workspace.skills config in harness/index.ts which points at
      the director/skills/ directory.
```

## Brand registry

`src/harness/brand-registry.ts` maps brand names → canonical hex colors. Used by `commit-brief`'s sanitizer:

```
   1. agent emits brand.primaryColor (sometimes malformed JSON)
   2. commit-brief calls safeHexColor(value) — strict #hex regex
   3. if rejected AND brand.name is in registry → use canonical hex
   4. if name unknown too → DEFAULT_BRAND violet
```

To add a brand:

```ts
// brand-registry.ts
{ name: "MyCo", primaryColor: "#FF6600", accentColor: "#FFF" }
```

Lookup is case-insensitive name match, no fuzzy matching.

## Skills bundled today

```
   workflow/    pipeline order, gates, "do not stop after commit-brief"
   brief/       field-by-field inference cheat sheet, worked example
   storyboard/  concept-first beats, shot grammar, anti-patterns
   design/      block variety, palette mood, when to add overlays
   validate/    how to read the report, retry policy, glossary
```

`workflow` is the meta-skill — the agent reads it FIRST every turn. The others are read on-demand by the agent when it gets to that phase.

## SSE event shape

`/api/chat` writes a stream of envelopes:

```ts
interface VibeFramesEvent {
  v: 1;
  runId: string;
  seq: number;            // monotonic per run
  projectId: string;
  ts: number;
  type: string;           // see filter list below
  payload: unknown;
}
```

What's filtered out (noise):
- `display_state_changed`
- `tool_input_delta` / `_start` / `_end`
- `subagent_text_delta` (legacy from subagents arch)
- `message_update` (full message rebuilds — UI derives from tool_end)
- `usage_update`
- `state_changed`

What the UI sees:
- `run.start` / `run.complete`
- `agent_start` / `agent_end`
- `message_start` / `message_end`
- `text_delta` (final reply tokens)
- `tool_start` / `tool_end` (drives the activity stream + composition delta)

`use-harness-chat.ts` parses these and updates the assistant message's tool list. `use-composition.ts` watches that list for `compositionHtml` payloads and re-renders the preview iframe.

## Local dev quick reference

```
   pnpm dev                      → http://localhost:3000  (single-agent mode)
   pnpm typecheck                tsc --noEmit
   pnpm test                     vitest (skip e2e)
   pnpm test:e2e                 live LLM e2e (needs OPENAI_API_KEY)
   pnpm clear-data               wipe .data/ (LibSQL + composition snapshots)

   env (.env.local):
     OPENAI_API_KEY=…             required
     VIBEFRAMES_MODEL=gpt-4o      override Director model (default mini)
     VIBEFRAMES_DB_URL=…          libSQL URL (default file:./.data/vibeframes.db)
```

## Files to touch when working on…

| Goal                            | Files to read/edit                                                |
|---------------------------------|-------------------------------------------------------------------|
| Add a new block                 | `services/clip-registry.service.ts` (+ optionally `composition/translator.ts`) |
| Tweak block var rendering       | `composition/translator.ts` → `varsForBlock()`                    |
| Tweak block selection           | `composition/translator.ts` → `pickPrimaryBlock()`                |
| Add a validation rule           | `composition/validation-rules.ts`, `director/skills/validate/skill.md` |
| Change agent behavior at a phase| `director/skills/<phase>/skill.md`                                |
| Change pipeline ordering        | `director/skills/workflow/skill.md`                               |
| Add a new tool                  | `tools/<name>.ts`, register in `director/tools.ts`, mention in workflow skill |
| Change the UI                   | `components/studio/`, `app/studio/[projectId]/`                   |
| Change the preview player       | `components/studio/preview/panel.tsx`                             |
| Change SSE filtering            | `app/api/chat/route.ts` → `FILTERED_EVENT_TYPES`                  |
| Change persisted state shape    | `state.ts` (Zod), schema migration plan needed for old threads    |

## Future hooks (not built)

- **DESIGN.md import** — parse a brand's design system into `brief.brand`. Schema fields already there.
- **Multi-pass refinement** — beyond the 2-attempt validate↔compose retry.
- **Caption track** — see [LLD-07](lld/lld-07-captions.md).
- **TTS / audio** — M11 in the build plan.
- **YAML block defs** — `clip-registry.service.ts` blocks could move to per-block `blocks/<id>.yaml` for non-engineer authoring.
