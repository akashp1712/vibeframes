---
name: social-overlays
description: Use ONLY when the brief explicitly hints at creator / short-form / social content. Layers TikTok / IG / X / YouTube UI (avatar, mention, hashtag, comment, like-counter, follow) over a base scene. Adding these unprompted reads as confused vibe-mixing.
---

# Social Overlays — Skill

You are layering **social-network UI** on top of a base scene. These are small absolute-positioned overlays that signal "this is creator / short-form content".

For the foundational scene (background, headline, etc.) see `skills/blocks/skill.md`. For cosmetic textures over the whole frame see `skills/effects/skill.md`.

## The Iron Law

```
DON'T ADD SOCIAL OVERLAYS UNPROMPTED. ≤ 3 PER SCENE.
```

A corporate SaaS intro doesn't need a TikTok like-counter. A clean product reveal doesn't need a hashtag-pill. Add these only when the brief mentions **TikTok / Instagram / YouTube Shorts / creator content / `@handles` / `#hashtags` / engagement metrics / "follow me" CTA**.

Thinking *"a hashtag-pill would add personality"*? Stop. Personality from social UI signals "this is for creators". If the brief isn't for creators, the personality is wrong.

<Good>
*Brief: "15-second TikTok ad introducing our app."*
```
Track 0  background-fill                  0 ───────► 15000
Track 1  hero-title "Track your reps"     0 ───────► 15000
Track 3  social-avatar (creator attr.)    0 ───────► 15000
Track 4  like-counter                     0 ───────► 15000
Track 5  hashtag-pill "#fitness"          0 ───────► 15000
```
Brief explicitly named TikTok. Three overlays, each on its own track, all scene-long. Creator vibe is intentional.
</Good>

<Bad>
*Brief: "Clean 6-second product intro for our B2B SaaS."*
```
Track 3  social-avatar                    0 ────► 6000
Track 4  like-counter                     0 ────► 6000
```
Brief is corporate SaaS. Adding creator UI fights the brand. Don't reach for these unprompted.
</Bad>

## Track conventions

Social overlays always layer **above** scene content. Use **track 3 or higher**, after backgrounds (0), hero content (1), and lower-thirds (2). Within track 3+, higher index = renders on top.

```
Track 0   background-fill                                  (scene background)
Track 1   hero-title / split-screen / kinetic-words ...    (main beat)
Track 2   subtitle-anchor / lower-third                    (caption)
Track 3+  social overlays (this skill)                     ◄── you are here
Track 4+  effects (grain, scanlines)                       (top-most)
```

Multiple social overlays on the same scene each get their own track — don't stack two on track 3.

## Social units (TikTok / IG / X vibes)

| Block id | Kind | Category | Anchor | When to use | Vars |
|---|---|---|---|---|---|
| `social-avatar` | unit | social | top-left | Creator attribution at scene start. Pair with any scene | `avatarUrl`, `displayName`, `handle` |
| `mention-card` | unit | social | bottom-right | Floating @mention card with a one-line tagline | `handle`, `tagline` |
| `hashtag-pill` | unit | social | bottom-centre | `#hashtag` pill — reinforces topic / campaign | `tag` |
| `comment-bubble` | unit | social | left-centre | Faux comment from a viewer — useful for "look at this take" moments | `avatarUrl`, `handle`, `body` |
| `like-counter` | unit | social | right-centre | TikTok-style engagement column (❤ 💬 ↗) — implies popularity | `likes`, `comments`, `shares` |

## Follow CTA units

| Block id | Kind | Category | Anchor | When to use | Vars |
|---|---|---|---|---|---|
| `follow-button` | unit | follow | bottom-centre | End-beat "Follow @handle" CTA. Pair with the end of the composition | `handle` |
| `follow-arrow` | unit | follow | varies | Animated arrow pointing at the follow button — only use *with* `follow-button` | `label` |

## Layering patterns

**Creator content pattern** (TikTok / Reels): social-avatar (track 3, scene-long) + like-counter (track 4, scene-long) + hashtag-pill (track 5, scene-long).

```
Track 0  background-fill                  0 ────────► 8000
Track 1  hero-title / kinetic-words       0 ────────► 8000
Track 3  social-avatar                    0 ────────► 8000
Track 4  like-counter                     0 ────────► 8000
Track 5  hashtag-pill                     0 ────────► 8000
```

**Engagement-spike pattern**: scene → 4s → comment-bubble pops in for 2s → fades.

```
Track 0  background-fill                  0 ─────────────► 10000
Track 1  split-screen                     0 ─────────────► 10000
Track 3  comment-bubble                   4000 ────► 6000
```

**Follow-CTA pattern** (end of video): place follow-button on track 3 for the final 2–3s, with follow-arrow on track 4 for the last 1s.

```
Track 0  background-fill                  0 ──────────────────► 8000
Track 1  end-card                         5000 ──────► 8000
Track 3  follow-button                    6000 ─► 8000
Track 4  follow-arrow                     6500 ► 8000
```

## Picking social overlays — quick rules

- **One scene, light context**: just `social-avatar` (creator attribution) or just `hashtag-pill` (topic).
- **Full creator vibe**: `social-avatar` + `like-counter` + `hashtag-pill` all scene-long.
- **Reactive moment**: `comment-bubble` triggered mid-scene (not full duration).
- **Closing CTA**: `follow-button` (+ optional `follow-arrow`) in the final 2–3s.
- **Don't combine** `mention-card` with `social-avatar` — they fight for the same attribution job. Pick one.
- **Don't combine** `follow-arrow` without `follow-button` — the arrow needs a target.

## Track-budget guidance

For a single scene, **3 social overlays is the comfortable maximum**. Beyond that the frame gets noisy and the underlying content suffers. If the brief calls for more, drop one to a shorter window (e.g. comment-bubble appears for 2s instead of full-scene).

## Definition of Done — before adding a social overlay

1. **Brief justification** — brief actually calls for short-form / creator vibe. (See Iron Law above. Don't add unprompted.)
2. **Track ≥ 3** (after backgrounds, hero, lower-thirds).
3. **Own track per overlay** — no two on track 3.
4. **`follow-arrow` only with `follow-button`** — the arrow needs a target.
5. **≤ 3 social overlays per scene** — beyond that the frame is noise.
6. **No conflicts** — `mention-card` and `social-avatar` both attribute the creator; pick one.
