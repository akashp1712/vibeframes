# LLD-09 · Codebase cleanup & hierarchical reorganization

Status: Proposed
Owner: VibeFrames
Last updated: 2026-06-06
Related: LLD-08 (phased director — drives some of the moves here)

## TL;DR

Three categories of work:

```
   ┌──────────────────────────────────────────────────────────────┐
   │  1. DEAD CODE      — delete files & exports nobody uses      │
   │  2. STALE TYPES    — types from M5 design phase that no      │
   │                      longer match the runtime                │
   │  3. REORGANIZE     — flat dirs → hierarchical, phase-aligned │
   └──────────────────────────────────────────────────────────────┘
```

Goal: a codebase where you can find a thing in one mental hop. New module structure aligns with LLD-08's Director-and-subagents architecture so we don't reorganize twice.

The repo also ships **runtime skills** (`src/harness/skills/`) that are markdown bundles loaded into the agent each turn. We trim what isn't earning its place; YAML-based block definitions are deferred (per the conversation — useful, not now).

---

## Current map of `src/`

```
   src/
   ├── app/                          (Next.js routes — small, ok)
   │   ├── page.tsx                  landing
   │   ├── layout.tsx
   │   ├── globals.css
   │   ├── api/chat/route.ts         SSE chat
   │   └── studio/
   │       ├── page.tsx              redirect to fresh project
   │       └── [projectId]/
   │           ├── page.tsx
   │           └── studio-client.tsx 3-pane shell
   │
   ├── components/
   │   ├── landing/                  landing-page sections (5 files)
   │   ├── layout/                   topbar, footer
   │   ├── studio/                   3-pane components
   │   └── ui/                       shadcn/MagicUI primitives
   │
   ├── harness/                      ◄── most of the cleanup is HERE
   │   ├── __tests__/                vitest specs
   │   ├── prompts/                  composer.ts, index.ts
   │   ├── services/                 clip-registry, transition-registry
   │   ├── skills/                   runtime markdown skills
   │   ├── tools/                    add-clip, add-transition, …
   │   ├── composition-store.ts      ◄── disk-backed Composition
   │   ├── store.ts                  ◄── DEAD re-export shim
   │   ├── config.ts                 HARNESS_CONFIG
   │   ├── index.ts                  factory + barrel exports
   │   ├── mode.ts                   createDirectorMode
   │   ├── mutations.ts              pure ops on Composition tree
   │   ├── serialize.ts              jsonTree → HyperFrames HTML
   │   ├── state.ts                  VibeFramesStateSchema
   │   ├── storage.ts                LibSQL store factory
   │   ├── types.ts                  ◄── MIXED: real + stale
   │   ├── use-composition.ts
   │   └── use-harness-chat.ts
   │
   ├── lib/                          utils (cn, project-id, tool-labels)
   ├── protocol/                     SSE event shape + writer
   └── types/                        hyperframes.d.ts (global decls)
```

The flat `harness/` dir is what makes things hard to navigate. With LLD-08 we'll add ~15 more files (4 subagents × prompt+tools, plus orchestration). Without reorganizing, that becomes 35 files in one directory.

---

## 1. Dead code to delete

```
   ┌───────────────────────────────────────┬───────────────────────────────┐
   │ file                                  │ why                           │
   ├───────────────────────────────────────┼───────────────────────────────┤
   │ src/harness/store.ts                  │ 7-line re-export shim of      │
   │                                       │ composition-store.ts. Tools   │
   │                                       │ should import direct.         │
   │                                       │                               │
   │ src/components/landing/tech-stack.tsx │ already commented out in      │
   │ src/components/landing/tech-logos.tsx │ page.tsx ("// fix correct     │
   │ src/components/landing/__tests__/     │ logo"). Not user-visible.     │
   │   tech-stack.test.tsx                 │                               │
   └───────────────────────────────────────┴───────────────────────────────┘
```

Action:

```
   • git rm src/harness/store.ts
     update tools/{add-clip,update-clip,remove-clip,add-transition,
                   get-composition}.ts to import composition-store directly
     update harness/index.ts barrel: import path change

   • git rm src/components/landing/tech-stack.tsx
     git rm src/components/landing/tech-logos.tsx
     git rm src/components/landing/__tests__/tech-stack.test.tsx
     remove the commented-out import + JSX from src/app/page.tsx
```

---

## 2. Stale types in `src/harness/types.ts`

The file mixes **live** types (Clip, Track, Composition) with **stale M5-design-phase** types (HarnessMode = "plan"|"vibe", HarnessStateSchema, CompositionStatus). The stale ones don't match the runtime; only `__tests__/types.test.ts` exercises them.

```
   types.ts (TODAY) — 51 lines
   ──────────────────────────
                                                   matches runtime?
   CompositionStatus = "empty"|"planning"|"composing"|...    NO  (no consumer)
   HarnessMode       = "plan"|"vibe"                         NO  (Director-only)
   ClipSchema, Clip                                          ✓
   TrackSchema, Track                                        ✓
   CompositionSchema, Composition                            ✓
   HarnessStateSchema  { mode, status, composition, plan,    NO  (state.ts is
                         error }                                  the real one)
```

Action:

```
   • Split types.ts into:
       harness/composition/schema.ts     (Clip, Track, Composition + Zod)
   • Delete CompositionStatus, HarnessMode, HarnessStateSchema (3 exports).
   • Delete __tests__/types.test.ts (only exercised the stale exports).
   • Update barrel exports in harness/index.ts.
```

This also unblocks LLD-08 — `state.ts` becomes the only place Harness-state types live.

---

## 3. Reorganize `src/harness/`

```
   src/harness/                          ← was: 11 top-level files + 4 dirs
   │
   ├── index.ts                          factory + barrel
   ├── config.ts                         HARNESS_CONFIG
   ├── storage.ts                        LibSQL factory
   ├── state.ts                          VibeFramesStateSchema (extended in LLD-08)
   │
   ├── composition/                      ── domain: the artifact we build ──
   │   ├── schema.ts                     Clip / Track / Composition (Zod)
   │   ├── mutations.ts                  pure ops (add/update/remove)
   │   ├── store.ts                      disk-backed per-project store
   │   │                                 (renamed from composition-store.ts)
   │   ├── serialize.ts                  jsonTree → HyperFrames HTML
   │   └── __tests__/
   │
   ├── director/                         ── the orchestrator (mode) ──
   │   ├── mode.ts                       createDirectorMode
   │   └── prompt.ts                     buildDirectorPrompt
   │
   ├── subagents/                        ── pipeline phases ──
   │   ├── brief/
   │   │   ├── prompt.ts
   │   │   ├── tools.ts                  commit-brief
   │   │   └── definition.ts             HarnessSubagent factory
   │   ├── storyboard/
   │   │   ├── prompt.ts
   │   │   ├── tools.ts                  commit-storyboard, revise-beat,
   │   │   │                             propose-storyboard, get-block-schemas
   │   │   └── definition.ts
   │   ├── compose/
   │   │   ├── prompt.ts
   │   │   ├── tools.ts                  create-beat, finish-compose,
   │   │   │                             revise-beat, remove-beat
   │   │   ├── beat-translator.ts        beat → add-clip(s) + add-transition
   │   │   └── definition.ts
   │   └── validate/
   │       ├── prompt.ts
   │       ├── tools.ts                  check-storyboard
   │       ├── rules.ts                  pure rule fns
   │       └── definition.ts
   │
   ├── tools-internal/                   ── building blocks; Director never sees ──
   │   ├── add-clip.ts                   (used only by beat-translator)
   │   ├── update-clip.ts
   │   ├── remove-clip.ts
   │   └── add-transition.ts
   │
   ├── services/                         (unchanged — clip + transition registries)
   │
   ├── skills/                           runtime markdown skills (see §4)
   │
   ├── react/                            ── client hooks ──
   │   ├── use-composition.ts
   │   └── use-harness-chat.ts
   │
   └── __tests__/                        cross-cutting tests only
                                         (per-module tests live next to the module)
```

Why this shape:

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  • Top-level harness/ has FOUR dirs that map 1:1 to LLD-08      │
   │    architecture: composition (the artifact), director (the      │
   │    orchestrator), subagents/ (the pipeline), tools-internal/    │
   │    (the primitives). One mental hop to find anything.            │
   │                                                                 │
   │  • Each subagent dir is self-contained — prompt + tools +       │
   │    definition. Adding a new subagent later (Editor mode's       │
   │    revise-clip) means dropping a new sibling, not editing six   │
   │    files.                                                       │
   │                                                                 │
   │  • react/ holds the only client-side files in the harness.      │
   │    Today they sit at the top level, mixed with server code.    │
   │                                                                 │
   │  • __tests__/ at the harness root is for cross-cutting tests   │
   │    only (e.g. the spike). Per-module tests live next to the     │
   │    module they cover.                                           │
   └─────────────────────────────────────────────────────────────────┘
```

---

## 4. Skills cleanup — trim to what's earning its place (defer YAML)

Today's runtime skills (`src/harness/skills/`):

```
   skills/
   ├── blocks/skill.md           120 lines  ✓ keep
   ├── effects/skill.md           97 lines  ◑ scope (see below)
   ├── hyperframes/skill.md      238 lines  ✓ keep — core authoring rules
   ├── social-overlays/skill.md  123 lines  ◑ scope (see below)
   └── transitions/skill.md      137 lines  ✓ keep
                                 ─────
                                 715 lines loaded every turn (today)
```

These are loaded into the agent's prompt **every turn** via Mastra's Workspace. With four phase subagents (LLD-08), each subagent only loads the skills it needs — not all of them every turn. The token-narrowing benefit is significant:

```
   ─── per-turn skill load (today vs LLD-08) ──────────────────
   Director (today, single agent):  loads all 5  → 715 lines
   Director (LLD-08):                loads 0      →   0 lines
   Brief subagent (LLD-08):          loads 0      →   0 lines
   Storyboard subagent (LLD-08):     loads 1      → 120 lines
   Compose subagent (LLD-08):        loads 5      → 715 lines
   Validate subagent (LLD-08):       loads 0      →   0 lines
```

But Compose still loads all five. So we should **also** scope by audience:

```
   Recommendation:
     • blocks         → Storyboard + Compose (planning + emission)
     • hyperframes    → Compose only (authoring rules — Storyboard plans
                        in concepts, doesn't write HTML)
     • transitions    → Compose only
     • effects        → Compose only IF brief calls for filmic/CRT/retro
                        → otherwise skip via the existing prompt rule.
                        Don't delete; gate.
     • social-overlays → Compose only IF brief.format == portrait/square
                         AND audience reads as social. Same gating.
```

Effects + social-overlays both already say in their `skill.md` "only when the brief calls for it." With phased subagents we can enforce that structurally rather than asking the model to remember.

**YAML block definitions — deferred per conversation.** Today's blocks live as TS objects in `services/clip-registry.service.ts` (351 lines). Splitting into `blocks/<id>.yaml` would be cleaner, but it's not blocking. Revisit after LLD-08 ships.

---

## 5. Reorganize `src/components/`

Smaller cleanup:

```
   src/components/
   ├── landing/         ✓ keep (5 files, all in use after tech-stack delete)
   ├── layout/          ✓ keep (topbar, footer)
   ├── studio/          ◑ split — see below
   └── ui/              ✓ keep (shadcn/MagicUI primitives)
```

`studio/` has 9 components mixing panels, the chat sub-tree, the topbar, the statusbar, and the timeline:

```
   studio/
   ├── chat-panel.tsx
   ├── chat-message.tsx          ──┐
   ├── ephemeral-status.tsx        ├─ chat sub-tree
   ├── markdown.tsx              ──┘
   ├── code-panel.tsx
   ├── preview-panel.tsx          ──┐
   ├── timeline-strip.tsx         ──┘  preview sub-tree
   ├── studio-statusbar.tsx
   └── studio-topbar.tsx
```

Proposed:

```
   studio/
   ├── shell/
   │   ├── studio-topbar.tsx
   │   └── studio-statusbar.tsx
   ├── chat/
   │   ├── chat-panel.tsx
   │   ├── chat-message.tsx
   │   ├── ephemeral-status.tsx
   │   └── markdown.tsx
   ├── preview/
   │   ├── preview-panel.tsx
   │   └── timeline-strip.tsx
   └── code/
       └── code-panel.tsx
```

Smaller change but easier to find things. Tests move with their components.

---

## 6. Misc

```
   ┌──────────────────────────────────────────────────────────────┐
   │ • src/harness/__tests__/types.test.ts → DELETE                │
   │   (only exercises stale HarnessStateSchema — gone in §2)      │
   │                                                               │
   │ • src/harness/__tests__/spike.subagents.test.ts → KEEP for    │
   │   now — documents Mastra subagent contract via assertions.    │
   │   Move to experiments/phased-spike/ once LLD-08 Slice A lands.│
   │                                                               │
   │ • experiments/phased-spike/ — created earlier, still useful   │
   │   as documentation. Keep README.md, drop unused TS scripts    │
   │   (run-baseline.ts, run-modes.ts, run-subagents.ts) since     │
   │   the in-repo test replaced them.                             │
   │                                                               │
   │ • src/harness/config.ts has stale `modes: { plan, vibe }`     │
   │   block. Delete that key, keep HARNESS_CONFIG.defaultModel    │
   │   and resolution constants.                                   │
   │                                                               │
   │ • src/types/hyperframes.d.ts — verify still needed            │
   │   (custom-element typing for <hyperframes-player>) before     │
   │   touching.                                                   │
   └──────────────────────────────────────────────────────────────┘
```

---

## Execution order (low-risk → high-risk)

```
   Step 1 — Pure deletes (no behavior change)
   ──────────────────────────────────────────
     • git rm tech-stack.tsx, tech-logos.tsx, tech-stack.test.tsx
     • clean up app/page.tsx (remove commented import + JSX)
     • config.ts: drop stale modes block
     ✓ green test suite at the end

   Step 2 — Stale types
   ────────────────────
     • split types.ts → composition/schema.ts (or new path)
     • delete HarnessMode/HarnessStateSchema/CompositionStatus
     • delete __tests__/types.test.ts
     • fix imports in mutations / serialize / tools / index.ts barrel
     ✓ green test suite

   Step 3 — store.ts shim
   ──────────────────────
     • inline composition-store imports into the 5 tools that use them
     • git rm store.ts
     • update barrel
     ✓ green test suite

   Step 4 — File reorganization (harness)
   ──────────────────────────────────────
     • move composition-store.ts → composition/store.ts
     • move mutations.ts          → composition/mutations.ts
     • move serialize.ts          → composition/serialize.ts
     • move use-*.ts              → react/
     • move mode.ts + prompts/    → director/
     • Note: tools/ stays put for now; it splits when LLD-08 Slice B
       lands and tools become phase-scoped.
     ✓ green test suite

   Step 5 — Components reorganization
   ──────────────────────────────────
     • create studio/{shell,chat,preview,code}/
     • move files; update imports in studio-client.tsx
     ✓ green test suite

   Step 6 — Skills scope
   ─────────────────────
     • this lands WITH LLD-08 Slice B (when subagents exist to
       carry per-phase skill scoping). Don't do it before — there's
       no consumer yet.
```

Each step is a separate commit/PR. CI is green at every checkpoint.

---

## What this LLD does NOT change

```
   ✓  tsconfig path alias (@/* → src/*)
   ✓  vitest config
   ✓  CI workflow
   ✓  package.json scripts
   ✓  public domain shapes (Clip, Track, Composition — only their
      file location changes)
   ✓  the SSE event protocol (envelope + event types stay)
   ✓  /api/chat handler signature
   ✓  Studio routes / UI
```

If a step would change any of these, that's a separate decision and gets its own ADR.
