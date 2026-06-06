---
name: transitions
description: Use when sequencing clips on the same track. Picking, timing, and rendering transitions between adjacent clips. Covers the Tier 1 catalog, when to use a hard `cut` instead, and how to choose `vars` intentionally rather than letting them auto-fill.
---

# Transitions — Composition Skill

Transitions live **between two adjacent clips on the same source track**. They never replace a clip — they sit on a dedicated overlay track that straddles the boundary. This separation keeps the source clips clean and lets you swap or remove a transition without touching the underlying scenes.

For the foundation (render contract, layout, typography) see `skills/hyperframes/skill.md`. For scene-building blocks see `skills/blocks/skill.md`. For social and effect overlays see `skills/social-overlays/skill.md` and `skills/effects/skill.md`.

## The Iron Law

```
ONE TRANSITION PER CUT. CHOOSE vars INTENTIONALLY.
```

Don't stack two transitions on the same boundary — they fight and read as a glitch.

When a transition declares required `vars` (e.g. `bgClass`, `anchor`), pass them **explicitly** based on the brief. The `add-transition` tool will auto-fill from registry defaults if you omit them, but auto-filled means the visual choice was made by the server, not by you. The journal will tell on you: a `note: "Auto-filled …"` in the result means you didn't direct the moment.

<Good>
```
add-transition {
  sourceTrackId: "track-main",
  transitionId: "iris-close",
  vars: { bgClass: "bg-slate-950", anchor: "50% 80%" }  // anchor on the CTA button below
}
```
Explicit `bgClass` matches the next clip's palette; `anchor` is chosen to focus the eye on what comes next.
</Good>

<Bad>
```
add-transition {
  sourceTrackId: "track-main",
  transitionId: "iris-close"
  // no vars — will auto-fill bgClass: "bg-black", anchor: "50% 50%"
}
```
Generic centred iris on plain black. The transition happens, but you didn't direct it — the server did.
</Bad>

## When to add a transition

Reach for a transition when:

- **Two clips on the same track** abut directly (`clip B.startMs === clip A.startMs + A.durationMs`) and the cut feels too sharp.
- **The scene changes context** (intro → reveal, reveal → CTA, CTA → end-card) and the brief calls for punctuation.
- **The brief explicitly asks** ("make the transition smooth", "punch into the next scene").

Skip transitions when:

- The composition is < 4 seconds — there's not enough room for a transition window to feel intentional.
- Clips are on **different tracks** (they're layered, not sequenced — use `add-clip` timing instead).
- The brief calls for a **hard cut** vibe (editorial, news, montage). Use `cut` to *declare* the boundary without rendering an overlay.

## How `add-transition` works

You call `add-transition` after you've already placed the two source clips. The tool:

1. Looks up the transition in the registry (must be Tier 1 — see below).
2. Figures out the **cut point** — either the `cutMs` you pass, or the boundary between the last two clips on `sourceTrackId`.
3. Substitutes any required `vars` into the transition's template.
4. Adds a short overlay clip on a dedicated `track-transition-<sourceTrackId>` track, centred on the cut point and lasting `durationMs` (default: the transition's `defaultDurationMs`).

The overlay clip is what renders the transition. The source clips are untouched.

## Three tiers — what you can use right now

The registry exposes 25+ transition ids, but only **Tier 1** is renderable today. Higher tiers are catalog stubs you can *plan toward* but `add-transition` will refuse to materialise them.

| Tier | Status | Can use? | Examples |
|------|--------|----------|----------|
| 1 | Shipped — has `template` | ✅ yes | `cut`, `fade`, `fade-through-black`, `fade-through-white`, `slide-left`, `slide-up`, `slide-stack`, `zoom-in`, `zoom-out`, `zoom-punch-in`, `zoom-punch-out`, `wipe-circle`, `wipe-diagonal`, `wipe-checker`, `iris-open`, `iris-close`, `blur-bridge`, `glitch-cut` |
| 2 | Catalog stub — planned | ❌ no (tool refuses) | `morph-shapes`, `morph-type` |
| 3 | VFX — registry-backed, future | ❌ no | `vfx-shatter`, `vfx-liquid`, `vfx-portal` |

If you pick a Tier 2 or Tier 3 transition, **fall back to the closest Tier 1 equivalent**:

| Wanted | Fallback (Tier 1) |
|--------|-------------------|
| `morph-shapes`, `morph-type` | `blur-bridge` |
| Any `vfx-*` | `fade-through-black` (placeholder until VFX ships) |

## Tier 1 — quick reference

| Transition | Kind | Default ms | When to use | Vars |
|---|---|---|---|---|
| `cut` | cut | 0 | Hard editorial boundary; you want to *declare* it but not render an overlay | — |
| `fade` | fade | 500 | Gentle handoff between similar scenes | — |
| `fade-through-black` | fade | 600 | Scene change that feels like a paragraph break | — |
| `fade-through-white` | fade | 500 | Upbeat brand moment or reveal | — |
| `slide-left` | slide | 500 | Horizontal page-turn feel | `bgClass` |
| `slide-up` | slide | 500 | Vertical-feed (social) compositions | `bgClass` |
| `slide-stack` | slide | 600 | Cards-stacking feel — coloured panel with shadow edge slides across. Punchier than `slide-left` | `bgClass` |
| `zoom-in` | zoom | 400 | Punch / beat-sync between dramatic moments | — |
| `zoom-out` | zoom | 400 | Camera-flash between still moments | — |
| `zoom-punch-in` | zoom | 500 | Beat-sync punch — coloured panel scales 0→1→1.5 with a flash. Punchier than `zoom-in` | `bgClass` |
| `zoom-punch-out` | zoom | 500 | Mirror of `zoom-punch-in` — scales 1.5→1→0. Use to feel like falling away from a moment | `bgClass` |
| `wipe-circle` | wipe | 600 | Camera-iris reveal — coloured circle grows from centre to fill the frame | `bgClass` |
| `wipe-diagonal` | wipe | 500 | Energetic diagonal band sweeps across — sports-reel feel | `bgClass` |
| `wipe-checker` | wipe | 700 | 4×4 tile grid flashes on with a diagonal stagger. Retro / game-show / data-driven feel | `bgClass` |
| `iris-open` | wipe | 700 | Camera-iris that opens *from an anchor point* — coloured fill shrinks to a pinhole at the anchor. Use for focus-pulls | `bgClass`, `anchor` |
| `iris-close` | wipe | 700 | Camera-iris that closes *onto an anchor point* — coloured fill blooms outward from the anchor | `bgClass`, `anchor` |
| `blur-bridge` | blur | 600 | Dream / introspective handoff — real backdrop-filter blur pulse | — |
| `glitch-cut` | blur | 350 | Brief RGB-split + white flash. Tech / cyberpunk / data-corruption vibe. Use sparingly | — |

## Timing rules

- **Default duration** is fine for most cases — only override `durationMs` if the brief calls for something faster (≤300ms = abrupt) or slower (≥800ms = lingering).
- The overlay is **centred on the cut point** — half the duration sits in the outgoing clip's window, half in the incoming clip's. Pick durations that leave breathing room in both source clips (~30%+ of each clip should be untransitioned).
- Don't stack transitions — one transition per cut point.

## Definition of Done — before calling `add-transition`

1. Both source clips exist on the **same** `sourceTrackId`, and they touch at the cut point.
2. The transition id is **Tier 1** (call `get-transition-schemas` if unsure).
3. Required `vars` are **explicitly passed** — not auto-filled. If the result `note` mentions "Auto-filled…", you skipped a direction choice.
4. The window (`durationMs`) leaves ≥30% of each source clip untransitioned.
5. **One transition per cut point.** No stacking.
6. Prefer `cut` (no overlay) when the composition's energy is already high or the brief calls for editorial pacing.

## Example sequence — fade through black between a hero and a CTA

```text
1. add-clip { trackId: "track-main", html: <hero>, startMs: 0,    durationMs: 4000 }
2. add-clip { trackId: "track-main", html: <cta>,  startMs: 4000, durationMs: 3000 }
3. add-transition {
     sourceTrackId: "track-main",
     transitionId: "fade-through-black",
     // cutMs defaults to 4000 (boundary between the two clips)
     // durationMs defaults to 600 (transition's defaultDurationMs)
   }
   // → overlay clip placed at startMs=3700, durationMs=600 on
   //   track-transition-track-main
```
