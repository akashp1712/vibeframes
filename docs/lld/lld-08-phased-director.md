# LLD-08 · Phased Director — Director + four phase subagents (YOLO, single-turn)

> **Status: SUPERSEDED (2026-06-06)** — subagents shipped briefly in M10 then rolled back.
> The runtime SSOT is **[`docs/harness-architecture.md`](../harness-architecture.md)** (single Director, no subagents).
> This doc is preserved for the *why* — the spike, the rollback, and what remains relevant if subagents return post-MVP.

**Why rolled back:** the four-subagent path measured ~1.5M tokens / 315 LLM calls per finished composition vs ~64k tokens / one Director loop on the same prompt — a ~24× cost regression with no measurable quality gain. Mastra dynamic tools resolve once per `sendMessage` (not per step), so a single Director with all tools registered + per-tool out-of-phase guards delivered the same pipeline ordering at 1/24 the cost.

**What survives from this LLD:**
- The **state shape** (`brief`, `storyboard`, `validationReport` on `VibeFramesState`) — kept in `state.ts`
- The **tool ordering discipline** (commit-brief → commit-storyboard → create-beat × N → finish-compose → check-storyboard) — encoded in `director/skills/workflow/skill.md`
- The **YOLO contract** (`state.yolo: true`, `disableBuiltinTools` of approval flow) — kept in `harness/index.ts`
- The **per-phase skills** (workflow / brief / storyboard / design / validate) — kept in `director/skills/`

**What was removed:** four subagent definitions, the `subagent` built-in tool wiring, the `subagent_*` SSE events filter list, the per-phase prompt files, the cross-phase return-value plumbing.

**When to revisit subagents:** when (a) Mastra ships `prepareStep` per-step tool refresh, (b) we have an Editor mode that genuinely needs separate personas (not just phases), or (c) we move to a multi-turn refinement loop where subagent return values carry between turns.

---

## TL;DR (original — historical context)

One **Director mode** orchestrates four **Mastra subagents** — Brief → Storyboard → Compose → Validate — inside a **single user turn**. The user types one prompt and receives a finished video. No mode switching, no human handshakes. The whole pipeline ran end-to-end in a 24-second spike against `gpt-4o-mini`.

```
   ┌──────────┐ one prompt   ┌─────────────────────────────────────────────┐
   │   USER   │─────────────►│              VIBEFRAMES HARNESS             │
   │          │              │                                             │
   │          │              │  ┌─────────── DIRECTOR mode ──────────┐     │
   │          │              │  │  one prompt: "you are an           │     │
   │          │              │  │  orchestrator. Use subagent tool   │     │
   │          │              │  │  to run Brief → SB → Compose → Val"│     │
   │          │              │  │                                    │     │
   │          │              │  │  tools: { subagent }               │     │
   │          │              │  └────────┬───────────────────────────┘     │
   │          │              │           │ spawns (4×, in order)           │
   │          │              │           ▼                                 │
   │          │              │  ┌──────┐ ┌──────────┐ ┌─────────┐ ┌──────┐ │
   │          │              │  │BRIEF │→│STORYBOARD│→│ COMPOSE │→│VALID │ │
   │          │              │  └──────┘ └──────────┘ └─────────┘ └──────┘ │
   │          │              │                                             │
   │          │◄─────────────│  finished composition + summary             │
   └──────────┘              └─────────────────────────────────────────────┘
```

This document supersedes the earlier "phase enum + dynamic tool filtering inside one mode" sketch. The spike (`src/harness/__tests__/spike.subagents.test.ts`) proved subagents are the right fit and modes are not.

---

## Why subagents, not modes (the spike result)

The spike ran a Director with four subagents against `gpt-4o-mini` and recorded:

```
   ════════════════════════════════════════════════════════════════════
     SPIKE RESULT — 24s end-to-end, 4 LLM-deep
   ════════════════════════════════════════════════════════════════════
   wall:        23,661 ms
   tool calls:  7  (in subagents — Director only called `subagent` ×4)
     1. commit-brief      (arc=demonstration, 12000ms)
     2. commit-storyboard (3 beats, sum=12000ms)
     3. create-beat(1)
     4. create-beat(2)
     5. create-beat(3)
     6. finish-compose
     7. check-storyboard  (pass=true)
   brief:       ✓
   storyboard:  ✓ (3 beats)
   composition: 6 clips
   validation:  ✓ pass
```

What the spike confirmed:

- Director can spawn 4 subagents **in order** in **one** `harness.sendMessage` call.
- Each subagent saw **only its phase's tools** (commit-brief never visible to Director).
- `subagent_tool_start` / `subagent_tool_end` events stream back so the parent thread sees what each subagent did.
- `state.yolo: true` + `disableBuiltinTools` cleanly suppress approval gates and noise tools.
- Each subagent **requires `defaultModelId`** — without it the runtime errors with `"No model ID available for subagent"`.

Why modes were rejected:

```
   ─── modes (rejected) ───────────────────────────────────────────
   • switchMode() ABORTS in-flight generation. A single-turn
     pipeline can't switch modes mid-turn — by design.
   • Modes are user-facing. They get a chip in the UI; the user
     toggles them. Phases of one pipeline are not user-facing.
   • Modes don't have a return value. Subagents do — which is
     exactly how Compose tells Validate "here are the clipIds".
```

Modes and subagents are not mutually exclusive — modes carry user-facing personas, subagents carry pipeline composition. **VibeFrames today has one mode and four subagents.** A future "Editor" persona (tweak an existing video) would be a second mode that uses different subagents.

---

## Lifecycle in one diagram

```
                                          one user turn
   ┌───────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │  user.message                                                     │
   │       │                                                           │
   │       ▼                                                           │
   │  ╔═════════════╗                                                  │
   │  ║  DIRECTOR   ║   reads user message, decides on tools           │
   │  ║   (mode)    ║   tools: { subagent } only                       │
   │  ╚══════╤══════╝                                                  │
   │         │ subagent({ agentType:"brief", task:<prompt> })          │
   │         ▼                                                         │
   │  ╔═════════════╗   own prompt + tools + skills + model            │
   │  ║    BRIEF    ║   tools: { commit-brief }                        │
   │  ║  (subagent) ║   skills: { } (none — minimal context)           │
   │  ╚══════╤══════╝   returns: "brief committed" + state side-effect │
   │         │                                                         │
   │         ▼ subagent({ agentType:"storyboard", task:… })            │
   │  ╔═════════════╗                                                  │
   │  ║ STORYBOARD  ║   tools: { get-block-schemas, propose-           │
   │  ║  (subagent) ║           storyboard, revise-beat,               │
   │  ║             ║           commit-storyboard }                    │
   │  ║             ║   skills: { blocks }                             │
   │  ╚══════╤══════╝                                                  │
   │         │                                                         │
   │         ▼ subagent({ agentType:"compose", task:… })               │
   │  ╔═════════════╗                                                  │
   │  ║   COMPOSE   ║   tools: { get-storyboard, create-beat,          │
   │  ║  (subagent) ║           revise-beat, finish-compose }          │
   │  ║             ║   skills: { hyperframes, blocks, transitions,    │
   │  ║             ║             effects, social-overlays }           │
   │  ╚══════╤══════╝                                                  │
   │         │                                                         │
   │         ▼ subagent({ agentType:"validate", task:… })              │
   │  ╔═════════════╗                                                  │
   │  ║  VALIDATE   ║   tools: { check-storyboard }                    │
   │  ║  (subagent) ║   skills: { } (deterministic rules, no skills)   │
   │  ╚══════╤══════╝                                                  │
   │         │                                                         │
   │         ▼                                                         │
   │  ╔═════════════╗                                                  │
   │  ║  DIRECTOR   ║   reads validate's report, writes one-line       │
   │  ║  (resumes)  ║   summary to user                                │
   │  ╚═════════════╝                                                  │
   │         │                                                         │
   └─────────┴─────────────────────────────────────────────────────────┘
             │
             ▼
   final SSE event: agent_end → UI shows finished video
```

The Director **never** sees domain tools. Only subagents have them. That's the win — token narrowing + impossibility-by-construction at the Director level.

---

## What each subagent owns (per-phase tools, prompts, skills, model)

This is your feedback #1 (per-phase skills) and #2 (per-phase prompts with openness) made concrete.

```
   ┌───────────────┬────────────────────────┬───────────────┬─────────────┬─────────────┐
   │ subagent      │ tools                  │ skills loaded │ model       │ prompt size │
   ├───────────────┼────────────────────────┼───────────────┼─────────────┼─────────────┤
   │ brief         │ commit-brief           │ —             │ gpt-4o-mini │ ~30 lines   │
   │ storyboard    │ get-block-schemas,     │ blocks        │ gpt-4o      │ ~80 lines   │
   │               │ propose-storyboard,    │               │             │             │
   │               │ revise-beat,           │               │             │             │
   │               │ commit-storyboard      │               │             │             │
   │ compose       │ get-storyboard,        │ hyperframes,  │ gpt-4o      │ ~40 lines   │
   │               │ create-beat,           │ blocks,       │             │             │
   │               │ revise-beat,           │ transitions,  │             │             │
   │               │ finish-compose         │ effects,      │             │             │
   │               │                        │ social-overlays│            │             │
   │ validate      │ check-storyboard       │ —             │ gpt-4o-mini │ ~20 lines   │
   ├───────────────┼────────────────────────┼───────────────┼─────────────┼─────────────┤
   │ DIRECTOR      │ subagent (built-in)    │ —             │ gpt-4o      │ ~25 lines   │
   └───────────────┴────────────────────────┴───────────────┴─────────────┴─────────────┘
```

**Per-phase skill scoping** uses Mastra's `allowedWorkspaceTools` on the subagent definition (or static `tools` if we don't use the workspace mechanism). The Brief and Validate phases load no skills at all — Brief is pure intent extraction; Validate is deterministic. Storyboard and Compose carry the heavy domain knowledge.

**Per-phase prompts can be focused without losing openness.** Each subagent has a *narrow* mission, but the subagent's prompt itself can absorb hypothetical / off-script asks within that mission. Example:

```
   ─── compose subagent prompt (sketch) ──────────────────────────────────
   You build clips for storyboard beats. Read the storyboard via
   get-storyboard, then call create-beat for every beat in order, then
   finish-compose.

   IF the storyboard contains an unfamiliar beat technique or block hint:
     decide whether create-beat can handle it. If yes, proceed. If no,
     revise the beat (revise-beat) to use the closest catalog block, and
     note what you changed in your final reply.

   IF the user's task contains mid-pipeline guidance ("make beat 2
     punchier", "prefer warm palette"): factor it in while building each
     beat. The Director relays user nuance via the task string.

   You DO NOT decide message/arc (that's Brief) or beat structure
   (that's Storyboard) or pass/fail (that's Validate).
   ────────────────────────────────────────────────────────────────────────
```

The narrowness isn't "the subagent only does X mechanically" — it's "the subagent owns this slice of the decision tree." Off-script asks that fall inside the slice get handled. Off-script asks that are *cross-phase* (e.g. user changes their mind about the arc) bubble up: the subagent reports a gap, the Director sees it and decides whether to spawn a fresh Brief subagent.

The Director's prompt stays open: it's a free orchestrator. For trivial requests ("change the title to 'Linear v2'") it spawns just Compose. For ambiguous / hypothetical asks ("can it do X?") it answers conversationally without spawning anyone.

---

## State (lean — phase is implicit)

```ts
//  src/harness/state.ts

VibeFramesStateSchema = {
  projectId:        string
  yolo:             bool = true   // bypass tool-approval gate (existing)
  currentRunId?:    string

  // NEW (set by subagents during the pipeline)
  brief:            Brief      | null   // committed by Brief subagent
  storyboard:       Storyboard | null   // committed by Storyboard subagent
  validationReport: Report     | null   // written by Validate subagent
}
```

There is **no `phase` enum**. The Director's prompt drives ordering. Phase is implicit in which subagent the Director just spawned. The state still carries the artifacts because:

- The UI needs them to render the brief / storyboard / validation panels.
- Subagents need them to read each other's output (Compose reads `state.storyboard`, Validate reads both).
- They survive process restarts via the existing LibSQL store.

```ts
BriefSchema = {
  message:    string ≥ 8 chars
  arc:        "problem-solution" | "reveal" | "demonstration" | "vibe" | "comparison"
  audience:   string ≥ 3 chars
  format:     "landscape" | "portrait" | "square"
  durationMs: int 5_000 .. 120_000
  narration:  "full" | "minimal" | "none"
  styleNotes: string?
  brand: {                          // hooks for future DESIGN.md import
    name?:         string
    primaryColor?: string
    accentColor?:  string
    fontFamily?:   string
  }
}

BeatSchema = {
  index:       int ≥ 1
  concept:     string ≥ 8
  shotType:    "extreme-close"|"close"|"medium"|"wide"|"over-the-shoulder"|"dutch-angle"
  cameraMove:  "static"|"dolly-in"|"dolly-out"|"push"|"parallax"|"orbit"|"rack-focus"
  techniques:  string[] ≥ 2          // forces variety
  blockHints:  string[]              // catalog block ids
  voCue:       string | null
  durationMs:  int ≥ 500
  built:       bool
  clipIds:     string[]
}

StoryboardSchema = {
  rhythm: "fast" | "moderate" | "slow" | "arc"
  beats:  BeatSchema[] (2..20)
}

ValidationReportSchema = {
  ranAt:  number
  issues: { severity:"error"|"warning"|"info", beatIndex?:int, rule:string, message:string }[]
  pass:   bool
}
```

---

## Single-turn timeline (annotated, from the spike)

This is what the spike actually emitted, mapped onto the phase model:

```
   t=0ms     thread_created
   t=27ms    agent_start                       (Director picks up the message)
   t=29ms    message_start, message_end        (user prompt persisted)

   ─── BRIEF ───
   t=1.1s    tool_input_start  toolName=subagent   (Director composing call #1)
   t=2.0s    tool_start        agentType=brief
   t=2.1s    subagent_start    brief
             subagent_tool_start  commit-brief
             subagent_tool_end    commit-brief    ← state.brief now set
             subagent_text_delta × N  ("brief committed.")
             subagent_end      brief
   t=2.1s    tool_end          subagent #1 result returned to Director

   ─── STORYBOARD ───
   t=3.3s    subagent_start    storyboard
             subagent_tool_start  commit-storyboard
             subagent_tool_end    commit-storyboard  ← state.storyboard now set
             subagent_end
   t=4.1s    tool_end          subagent #2 result returned

   ─── COMPOSE ───
   t=5.4s    subagent_start    compose
             subagent_tool_start  create-beat(1)
             subagent_tool_end    create-beat(1)   ← composition.clips += 2
             subagent_tool_start  create-beat(2)
             …
             subagent_tool_start  finish-compose
             subagent_end
   t=6.2s    tool_end          subagent #3 result returned

   ─── VALIDATE ───
   t=7.3s    subagent_start    validate
             subagent_tool_start  check-storyboard
             subagent_tool_end    check-storyboard ← state.validationReport set
             subagent_end
   t=8.0s    tool_end          subagent #4 result returned

   ─── DIRECTOR FINAL REPLY ───
   t=9.6s    message_start    (Director writes the summary)
             message_update × N  (token stream)
   t=10.1s   message_end, agent_end

   ──────────  Total: ~24s wall clock  ──────────
```

The Director's wall time is dominated by the four subagent spawns (each is its own LLM call). For a real composition (more beats, real HTML emission) we expect 60–120s on `gpt-4o`. Streaming SSE keeps the UI alive throughout.

---

## YOLO loop

YOLO = no human in the loop. Achieved entirely by:

```
   1. state.yolo: true
        → harness permission check returns "allow" for every tool call
          (verified by reading the harness runtime: line 2351 of
          @mastra/core/dist/harness/index.js)

   2. disableBuiltinTools: ["task_write","task_update","task_complete",
                            "task_check","ask_user","submit_plan"]
        → Director never sees tools that would require human response.

   3. Validation pass policy (auto-retry):
        report.pass === true              → Director writes final summary
        any error.severity === "error"    → Director re-spawns Compose with
                                            the issues as guidance (max 2x)
        only warnings/info               → ship; surface in final reply
```

```
   ┌───── retry on validate failure (max 2 attempts) ─────┐
   │                                                      │
   │   compose ──► validate ──► report                    │
   │      ▲                          │                    │
   │      └── if errors, ≤ 2 retries ┘                    │
   │                                                      │
   │   on attempt 3 still failing → ship + surface        │
   │   the issues in the final reply                      │
   │                                                      │
   └──────────────────────────────────────────────────────┘
```

The Director's prompt encodes this. No state machine, no phase enum — just the orchestrator's instruction to "if validate returns errors, spawn compose again with the issues as the task; max 2 retries."

---

## Tool surface, by subagent

```
   ─── BRIEF ────────────────────────────────────────────────────────────

   commit-brief
     in : Brief
     out: { ok: boolean, brief?: Brief, errors?: string[] }
     fx : Zod parse → if ok, write state.brief
          if parse fails, returns errors and the subagent retries

   ─── STORYBOARD ───────────────────────────────────────────────────────

   get-block-schemas              (existing)
     out: BlockCatalog

   propose-storyboard
     in : { storyboard: Storyboard }
     out: { ok: boolean, errors?: string[] }
     fx : Zod parse + duration-sum check
          (Σ beat.durationMs == brief.durationMs ± 500ms)
          on success, writes state.storyboard

   revise-beat
     in : { index: int, patch: Partial<Beat> }
     out: { storyboard }
     fx : merge patch, re-validate duration sum

   commit-storyboard
     in : {}
     out: { ok: boolean }
     fx : require state.storyboard != null and valid

   ─── COMPOSE ──────────────────────────────────────────────────────────

   get-storyboard
     out: { storyboard }

   create-beat                    ← THE big new tool
     in : { index: int }
     out: { beat: Beat, clipIds: string[] }
     fx : reads beat.shotType + cameraMove + techniques + blockHints,
          translates them into add-clip / add-transition mutations
          internally. Marks beat.built = true.

   revise-beat                    (alias of storyboard.revise-beat)
   remove-beat
     in : { index }

   finish-compose
     out: { ok: boolean }
     fx : require all beats have built==true (yolo: auto-builds any missing)

   ─── VALIDATE ─────────────────────────────────────────────────────────

   check-storyboard
     out: { report: ValidationReport }
     fx : runs the rules table (below); writes state.validationReport
```

The existing low-level tools (`add-clip`, `update-clip`, `remove-clip`, `add-transition`) become **internal**. Only `create-beat` calls them. This is the abstraction lift that hides milliseconds and HTML strings from the Director's planning surface.

---

## `create-beat` — the abstraction that hides milliseconds

```
   create-beat({ index: 3 })
        │
        ├─ reads beat from state.storyboard.beats[2]:
        │    concept:    "three feature panels reveal"
        │    shotType:   "wide"
        │    cameraMove: "parallax"
        │    techniques: ["staggered card entrance", "kinetic type"]
        │    blockHints: ["split-screen", "stats-callout"]
        │    durationMs: 9000
        │
        ▼
   beat-translator (pure):
     1. compute startMs = sum(prior beats' durationMs)
     2. resolve blockHints → catalog blocks (with brand vars)
     3. emit clip mutations:
          add-clip(track-bg,    background-fill,  startMs,    9000)
          add-clip(track-main,  split-screen,     startMs,    4500)
          add-clip(track-main,  stats-callout,    startMs+4500, 4500)
          add-transition(...)   if cameraMove == "parallax"
     4. mark beat.built = true, store clipIds
        │
        ▼
   returns { beat, clipIds: [c1, c2, c3] }
```

First version: hand-written switch on `shotType × blockHints` (boring, predictable, easy to debug). Future: replace the body with a small LLM call inside the tool when the catalog grows beyond the switch's expressiveness.

---

## Validation rules

`check-storyboard` runs pure functions over `(state.storyboard, composition)`:

```
   ╔════════════════════════════╦═══════════╦══════════════════════════════╗
   ║ rule id                    ║ severity  ║ check                        ║
   ╠════════════════════════════╬═══════════╬══════════════════════════════╣
   ║ beat-not-built             ║ error     ║ every beat.built == true     ║
   ║ clip-coverage              ║ error     ║ all clipIds resolve          ║
   ║ duration-drift             ║ warning   ║ |span − beat.dur| ≤ 500ms    ║
   ║ total-duration-drift       ║ warning   ║ |span − brief.dur| ≤ 1000ms  ║
   ║ consecutive-block-repeat   ║ warning   ║ no 3 in a row using same id  ║
   ║ brand-color-presence       ║ warning   ║ if primaryColor set, ≥ 30%   ║
   ║                            ║           ║ of clip html contains it     ║
   ║ shot-block-mismatch        ║ info      ║ extreme-close + split-screen ║
   ║ forbidden-pattern          ║ warning   ║ regex hits on browser-chrome ║
   ╚════════════════════════════╩═══════════╩══════════════════════════════╝
```

Pass policy:

```
   error?            → pass=false → Director re-spawns Compose (max 2 retries)
   only warnings?    → pass=true  → ship, note in final reply
   only info?        → pass=true  → silent in reply
```

---

## What stays unchanged — re-evaluated

You asked me to look again. Honest re-read with the spike findings:

```
   ┌───────────────────────────────────────────────────────────────────┐
   │ ✓  STAYS                                                          │
   │   • Composition / Track / Clip schemas (Zod)                       │
   │   • serialize() → HyperFrames HTML                                 │
   │   • LibSQL storage (threads/messages + harness state)              │
   │   • /api/chat SSE route handler signature                          │
   │   • Block catalog data + service                                   │
   │   • Studio UI at /studio/[projectId] + 3-pane shell                │
   │   • use-composition / use-harness-chat hooks                       │
   │   • Existing low-level mutation primitives (addClip etc.) —        │
   │     they become INTERNAL implementation of create-beat             │
   │                                                                    │
   │ ◑ CHANGES (I previously said "stays" — I was wrong)                │
   │   • mode.ts → renamed director-mode.ts; structure changes to       │
   │     wire subagents (was just an Agent factory before)              │
   │   • prompts/composer.ts → split into prompts/director.ts +         │
   │     subagents/{brief,storyboard,compose,validate}/prompt.ts        │
   │   • tools/ → reorganized by phase (see LLD-09)                     │
   │   • state.ts → adds brief/storyboard/validationReport              │
   │   • SSE protocol → subagent_* events become first-class for the    │
   │     UI (today they're filtered out as "noise")                     │
   │                                                                    │
   │ ✗  REMOVED                                                         │
   │   • types.HarnessMode = "plan"|"vibe" (stale, see LLD-09)         │
   │   • types.HarnessStateSchema (legacy, see LLD-09)                 │
   │   • types.CompositionStatus (legacy, see LLD-09)                  │
   │   • The agent never sees add-clip/update-clip/remove-clip/         │
   │     add-transition directly. They become internal helpers.         │
   └───────────────────────────────────────────────────────────────────┘
```

---

## Migration plan (three slices, each shippable)

```
   Slice A — Brief subagent only (the spike already proved feasibility)
   ────────────────────────────────────────────────────────────────────
   Add Director mode that spawns one subagent (Brief) and then proceeds
   to today's add-clip-style flow. Adds state.brief.
     Files: state.ts, prompts/director.ts, subagents/brief/{prompt,tools}
     Risk : low (spike proved the API works)
     Acceptance: a user prompt populates state.brief; UI shows it; rest
                 of the loop unchanged.

   Slice B — Storyboard + Compose subagents + create-beat
   ──────────────────────────────────────────────────────
   Add Storyboard and Compose subagents. Build the beat-translator.
   Move add-clip/update-clip/etc. behind create-beat.
     Files: subagents/{storyboard,compose}/*, beat-translator.ts
     Risk : medium (translator quality determines output quality)
     Acceptance: single prompt → 3-beat composition rendered in preview.

   Slice C — Validate + auto-retry
   ────────────────────────────────
   Add Validate subagent + 3 starter rules (beat-not-built, duration-
   drift, consecutive-block-repeat). Wire compose↔validate retry (max 2).
     Files: subagents/validate/*, validation/rules.ts
     Risk : low
     Acceptance: failed validation re-spawns Compose; passes on attempt 2;
                 final reply notes warnings.

   After C: retire prompts/composer.ts and the legacy "single-mode-with-
   all-tools" path. Update LLD-05 to reference this design.
```

---

## Open items / future hooks

```
   ▸ Brand DESIGN.md import — Brief subagent will parse a DESIGN.md file
     into state.brief.brand. No structural change to BriefSchema needed;
     the fields are already there.
   ▸ Workspace skill scoping — confirm allowedWorkspaceTools works as
     advertised in a follow-up spike when we wire workspace skills
     beyond the runtime markdown bundle.
   ▸ Editor mode (future) — second user-facing mode that spawns
     RevisingClip / SwapBlock subagents. Out of scope for this LLD.
   ▸ Caption track — LLD-07.
   ▸ TTS / audio — M11.
```
