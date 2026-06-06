# LLD-06 — `@hyperframes/studio` Adoption Plan

> Status: **Planning** — no code adopted yet. This doc captures *which* parts of the official `@hyperframes/studio` package are worth adopting, *when* we'd adopt them, and *what we'd need to build first* before each piece slots into VibeFrames.

## Context

The HyperFrames team ships `@hyperframes/studio` (https://hyperframes.heygen.com/packages/studio) — a React component library for building NLE-style ("Non-Linear Editor") UIs around HyperFrames compositions. Today VibeFrames hand-rolls its own 3-pane Studio (`src/components/studio/*`): chat panel + preview panel (iframe) + code panel + bottom timeline strip + topbar/statusbar.

Hand-rolling has been cheap so far because the Studio is mostly chrome around an iframe. As the catalog grows (units, transitions, captions, asset library) the chrome needs to do more — scrubbing, multi-track editing, drag-and-drop, per-clip property panels. That's where adopting Studio components starts paying for itself.

## What `@hyperframes/studio` provides (catalog)

The package exports a handful of primitives. The categorisation below is from a quick read of the public docs — we'll verify each before adopting.

| Component | What it does | Our equivalent today |
|---|---|---|
| `<Player>` | Renders a HyperFrames composition with playback controls (play/pause/scrub/loop) | `src/components/studio/preview-panel.tsx` (iframe + raw HTML) |
| `<Timeline>` | Multi-track timeline with drag, resize, snap, and marker support | `src/components/studio/timeline-strip.tsx` (read-only ribbon) |
| `<TrackList>` | Sidebar list of tracks with visibility/lock toggles | none |
| `<ClipInspector>` | Per-clip property panel (start, duration, html, vars) | none |
| `<EditorShell>` | Wires Player + Timeline + TrackList + ClipInspector with shared state | `src/components/studio/studio-shell.tsx` (hand-wired layout) |
| `<TransportControls>` | Play / pause / step / loop / time-cursor | partially in `preview-panel` |
| `<RulerStrip>` | Time ruler with seconds / frames toggle | none |
| `useComposition()` | Hook that exposes a typed composition state | `src/harness/use-composition.ts` (HTML→model parser) |

> **Verification needed**: re-check exports against the installed version before adoption — the public docs and the package can drift.

## Adoption tiers

We adopt in slices, not all at once. Each tier unlocks new editor capability and forces a small refactor on our side.

### Tier A — Player + TransportControls (lowest friction, highest UX win)

**Goal**: replace our raw iframe in `preview-panel.tsx` with `<Player>` so we get scrubbing, frame stepping, and a real time cursor.

**What changes on our side**:

- `preview-panel.tsx` switches from `<iframe srcDoc>` to `<Player composition={...}>`.
- `useComposition` becomes the source of truth (or wraps Studio's hook) — we keep our model so the chat panel and timeline see the same data.
- The renderer iframe contract (Tailwind CDN + GSAP loader) moves into Player config.

**Pre-reqs**:

1. Confirm `<Player>` accepts our serialized composition shape (or write a thin adapter in `src/lib/studio-adapter.ts`).
2. Audit the Tailwind/GSAP boot we currently inline in `preview-panel.tsx` — does Player ship its own renderer?
3. Tests for the adapter; Playwright snapshot of `/studio` before+after.

**Effort**: small (1–2 sessions).

### Tier B — Timeline + RulerStrip (the editing affordance)

**Goal**: replace our read-only `timeline-strip.tsx` with `<Timeline>` + `<RulerStrip>`. Users can drag-resize-snap clips; the agent reads the same updated state.

**What changes on our side**:

- The director agent already has `update-clip` (start/duration/html). User-driven drags call `setComposition` directly — no agent round-trip needed.
- Add a `lockedByAgent` state per clip so user edits don't fight an in-flight tool call.
- The `Track` type may need a `kind` ("source" | "transition" | "overlay") to drive Timeline's row styling — aligns with our new `kind` on blocks.

**Pre-reqs**:

1. Tier A landed.
2. Optimistic updates in `composition-store` (write through to disk *and* notify any subscribers).
3. Conflict resolution policy: agent edit + user edit on the same clip — last-write-wins for now, journal for ADR later.

**Effort**: medium (2–3 sessions). The conflict policy is the design risk.

### Tier C — TrackList + ClipInspector (the property surface)

**Goal**: per-clip property panel where the user sees and edits `vars`, start/duration, and the chosen block. Replaces "ask the agent to tweak" for nudge-level edits.

**What changes on our side**:

- The Composition model needs a `block` reference per clip (`blockId` + `vars`) so the inspector can render the right form. Today we only store rendered `html`. This *also* aligns with future-roadmap item #2 (cost-optimised generation).
- Each block in the registry needs to expose its var schema in a form-friendly shape (label, control type) — already mostly there via `BlockVar.description`.
- New tool: `set-clip-vars { clipId, vars }` so user edits route through the same mutation path the agent uses.

**Pre-reqs**:

1. Tier B landed.
2. Composition model migration (one-shot — old projects keep working since `blockId` is optional).
3. Block var schemas extended with control hints (`text`, `select`, `color`).

**Effort**: medium-high (3–4 sessions). The model migration is the architectural step.

### Tier D — `<EditorShell>` adoption

**Goal**: drop our hand-rolled shell and let Studio orchestrate Player + Timeline + TrackList + ClipInspector.

**What changes on our side**:

- `studio-shell.tsx` becomes a thin wrapper that injects our chat panel and statusbar around `<EditorShell>`.
- Our topbar (`studio-topbar.tsx`) and statusbar (`studio-statusbar.tsx`) remain — we own VibeFrames branding.

**Pre-reqs**:

1. Tiers A–C landed.
2. Visual parity sign-off with the current Studio.

**Effort**: small (1–2 sessions) given A–C did the heavy lifting.

## Risks & escape hatches

- **Version drift**: Studio is pre-1.0. Pin the exact version, journal each upgrade, and keep the adapter layer thin so we can swap implementations.
- **Style collisions**: Studio likely ships its own design tokens. We'll scope its CSS or run it inside a Tailwind-isolated subtree.
- **State duplication**: if we adopt Studio's state hooks alongside `useComposition`, we'll have two sources of truth. Adapter design from Tier A determines which one wins.
- **Renderer mismatch**: if Player insists on its own renderer config, we may lose the GSAP/Tailwind-CDN niceties we control today. Mitigate by keeping the iframe path behind a feature flag for the first two tiers.

## What to *keep* hand-rolled

- **Chat panel** — Studio doesn't ship one; ours is the heart of VibeFrames.
- **Preview-panel empty state** — branded, animated, opinionated.
- **Statusbar** — VibeFrames branding + harness state.
- **Topbar** — same.

## Decision log entry (when we start)

When we start Tier A, drop a `docs/decisions/0004-studio-player-adoption.md` capturing:

- The exact version pinned.
- The adapter shape (composition → Player props).
- Performance regressions vs the iframe (if any).
- Why we chose to migrate this layer first.
