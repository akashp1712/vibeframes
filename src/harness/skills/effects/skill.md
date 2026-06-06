---
name: effects
description: Use ONLY when the brief explicitly hints at filmic / cinematic / retro / VHS / CRT vibe. Cosmetic full-frame overlay blocks (grain, scanlines). Adding texture to a clean corporate brief reads as visual noise, not aesthetic.
---

# Effect Overlays — Skill

You are washing a **cosmetic texture** over the entire frame. Effects are pure look-and-feel: no copy, no positioning logic, no content. They sit on the **top-most track** so every other layer (background, hero, captions, social overlays) shows through.

For scene-building blocks see `skills/blocks/skill.md`. For social UI overlays see `skills/social-overlays/skill.md`.

## The Iron Law

```
ONE EFFECT MAX. BRIEF-JUSTIFIED ONLY.
```

Stacking `grain-overlay` + `scanlines-overlay` reads as visual chaos, not aesthetic. Pick the dominant vibe and commit. Don't add effects to clean SaaS / corporate / fintech briefs — the texture fights the polished feel.

Thinking *"a touch of grain would add cinematic feel"*? Stop. If the brief didn't ask for cinematic, you're imposing your own aesthetic on the user's piece.

<Good>
*Brief: "Documentary-style intro for our short film, 8 seconds."*
```
Track 0  background-fill                  0 ───────► 8000
Track 1  hero-title "Beneath the Surface" 0 ───────► 8000
Track 2  grain-overlay (low intensity)    0 ───────► 8000
```
Brief named documentary. One effect, full duration, low intensity — reads as filmic.
</Good>

<Bad>
*Brief: "Clean 6-second product intro for our SaaS dashboard."*
```
Track 2  grain-overlay                    0 ────► 6000
Track 3  scanlines-overlay                0 ────► 6000
```
Brief is corporate SaaS. Adding texture fights the brand. Stacking two effects on top reads as visual chaos.
</Bad>

## Track conventions

Effects always live on the **top-most track of the composition** — higher than backgrounds (0), hero content (1), lower-thirds (2), and social overlays (3+).

```
Track 0      background-fill                          (base)
Track 1      hero / split-screen / kinetic-words      (main beat)
Track 2      subtitle / lower-third                   (caption)
Track 3+     social overlays                          (creator UI)
Track N+1    effects                                  ◄── you are here (top-most)
```

If a composition has no social overlays, effects can sit on track 3. If social overlays already occupy tracks 3–5, effects go on track 6.

## Effect units

| Block id | Kind | Category | When to use | Vars |
|---|---|---|---|---|
| `grain-overlay` | unit | effect-overlay | Filmic grain + soft vignette. Cinematic / 35mm / documentary feel | `intensity` |
| `scanlines-overlay` | unit | effect-overlay | CRT-style horizontal scanlines with pulse. Retro / VHS / arcade / hacker feel | `opacityClass` |

## Use sparingly

If the brief mentions multiple aesthetic cues, pick the one that matches the longest beat. A 10s composition that opens cinematic and ends arcade should split the effect: grain on tracks 0–6s, scanlines on tracks 6–10s — never overlapping.

## When NOT to use effects

- **Clean corporate / SaaS / fintech briefs** — effects fight the polished feel. (See Iron Law.)
- **Compositions under 4s** — the effect doesn't have time to register before the cut.
- **Compositions with already-busy backgrounds** (gradients + photos + multiple social overlays) — adding texture on top muddies the frame.

## Spanning the whole composition

An effect typically runs the full composition duration. Place it at `startMs: 0` with `durationMs` equal to the timeline end. Use `get-composition` first to read `timelineEndMs`.

```
Track 0      background-fill              0 ───────────────► 8000
Track 1      hero-title                   0 ──► 3000
Track 1      cta-button                   3000 ──► 8000
Track 3      grain-overlay                0 ───────────────► 8000   ← full duration
```

## Picking the vibe

| Brief mentions | Effect to reach for | Intensity guidance |
|----------------|---------------------|--------------------|
| "cinematic", "filmic", "35mm", "documentary", "moody" | `grain-overlay` | `low` or `medium` |
| "retro", "VHS", "CRT", "arcade", "8-bit", "hacker", "terminal" | `scanlines-overlay` | `medium` (`opacityClass: "opacity-10"`) |
| "modern", "clean", "minimal", "SaaS", "corporate" | *none — skip effects* | — |

## Definition of Done — before adding an effect

1. **Brief justification** — brief explicitly hints at filmic / retro / cinematic / CRT vibe. (See Iron Law. Don't add unprompted.)
2. **Top-most track** of the composition.
3. **One effect maximum** — no stacking grain + scanlines.
4. **Full composition duration** (or a clearly-defined segment if switching mid-way).
5. **≥ 4s composition** so the effect has time to read.
