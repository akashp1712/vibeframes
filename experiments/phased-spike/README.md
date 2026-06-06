# Phased Director — Mastra Modes vs Subagents Spike

Goal: prove which Mastra primitive fits a YOLO single-turn pipeline (Brief → Storyboard → Compose → Validate) better. Spike both, observe the actual behavior.

## What we already know from type defs (`@mastra/core` v1.37.1)

| Capability                         | Modes                                       | Subagents                                  |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Switching                          | `harness.switchMode({ modeId })` — aborts in-flight generation | Parent calls built-in `subagent` tool mid-turn |
| Concurrency                        | Exactly one mode active at a time           | Multiple subagents per turn (sequential or parallel) |
| Context                            | Mode owns the user-facing thread            | Fresh thread per spawn (or forked)         |
| Per-instance tools                 | ✓ via `Agent.tools` (DynamicArgument)       | ✓ via `subagent.tools` + `allowedHarnessTools` |
| Per-instance workspace/skills      | ✓ via `Agent.workspace` (DynamicArgument)   | ✓ via `allowedWorkspaceTools` (filters parent workspace) |
| Per-instance model                 | ✓ `Mode.defaultModelId`                     | ✓ `Subagent.defaultModelId`                |
| Per-instance prompt                | ✓ `Agent.instructions`                      | ✓ `Subagent.instructions`                  |
| Returns to caller                  | n/a — mode IS the caller                    | ✓ subagent result returned to parent       |

The killer fact: **`switchMode` aborts in-flight generation.** A YOLO single-turn pipeline needs to walk Brief → Storyboard → Compose → Validate inside one user turn without aborting. That alone rules out modes for *phase orchestration*.

But modes might still be the right home for *user-facing* persona swaps (e.g. a future "Director" vs "Editor" toggle in the UI). They are not mutually exclusive with subagents — we can have one Director mode whose agent uses subagents for phases.

## Spike scenarios

Three runs, same prompt: `"make a 12-second product launch video for a SaaS called Linear"`.

1. **`run-modes.ts`** — define four modes (brief / storyboard / compose / validate). Use `switchMode` between phases. Observe whether generation can be chained or if it really aborts.
2. **`run-subagents.ts`** — define one Director agent with four subagents (brief / storyboard / compose / validate). Director's prompt instructs it to spawn each in order. Observe the chain.
3. **`run-baseline.ts`** — current single-prompt approach (control). Establish what we're comparing against.

Each script logs:
- Tools sent to the LLM at each step (token-cost proxy)
- Phase transitions
- Final output structure
- Wall-clock time
- Any errors / aborts

## Decision criteria

We pick subagents over modes if:

- [x] Modes can't chain inside one turn (type-defs say `switchMode` aborts; spike confirms in practice)
- [x] Subagents can be sequenced inside one turn without UI handshakes
- [x] Per-subagent skill scoping works (Brief subagent doesn't load `hyperframes` skill)

We pick modes (or modes-with-subagents-inside) if:

- Spike reveals a Mastra escape hatch — e.g. a "switchModeQuiet" or thread-internal mode swap that doesn't abort
- Subagent spawn latency dominates wall-clock time

## Running

```bash
cd experiments/phased-spike
pnpm install
# Uses OPENAI_API_KEY from repo's .env.local
node --env-file=../../.env.local --import tsx run-baseline.ts
node --env-file=../../.env.local --import tsx run-modes.ts
node --env-file=../../.env.local --import tsx run-subagents.ts
```

## Findings

(filled in after running)
