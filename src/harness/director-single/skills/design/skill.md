---
name: design
description: Visual design rules — variety across beats, brand color presence, palette mood mapping, when to add effect overlays. Read alongside storyboard for picking blockHints; the design rules drive the beat-to-block mapping.
---

# Design — visual rules

## Variety is the rule

The translator emits clips for the blockHints you specify. If every
beat hints `logo-headline`, every beat looks the same.

```
   Beat 1     opener            hero-title or logo-headline or kinetic-words
   Beat 2     feature reveal    split-screen or stats-callout
   Beat 3     emphasis          stats-callout or quote-pull
   Beat 4     CTA               cta-button
   Beat 5     close             end-card or logo-headline (different vars)
```

NEVER 3 adjacent beats with the same block id. The validator flags
this as `consecutive-block-repeat` and the user sees a warning.

## Palette mood

The bg gradient is auto-picked from `brief.styleNotes` by the translator:

```
   "dark", "cinematic", "noir"        from-slate-950 via-slate-900 to-black
   "warm", "sunset"                   from-amber-900 via-rose-950 to-slate-950
   "playful", "bright", "punchy"      from-indigo-700 via-fuchsia-700 to-amber-600
   default                            from-slate-900 to-black
```

If brief.brand.primaryColor is set, the translator paints a thin
accent line at the bottom of every bg clip in that color. This is
how brand-color-presence (validator) is satisfied automatically.

If unsatisfied (warning fires), it's because:
  - brief.brand.primaryColor was malformed (LLM emitted garbage hex)
  - You committed a brief without a primaryColor when one was implied

Fix: use `commit-brief` again with a clean canonical hex (e.g. for
known brands like Linear=#5E6AD2, Stripe=#635BFF).

## Effect overlays — brief-justified only

Effects (grain-overlay, scanlines-overlay) are pure cosmetic texture.
**Only add when the brief explicitly hints at it:**

```
   "cinematic" / "filmic" / "35mm" / "documentary"  → grain-overlay
   "retro" / "VHS" / "CRT" / "arcade" / "8-bit"     → scanlines-overlay
   "modern" / "clean" / "minimal" / "SaaS"          → no effect
```

Iron rule: ONE effect max. NO stacking.

## Social overlays — platform-justified only

`social-avatar`, `mention-card`, `hashtag-pill`, `comment-bubble`,
`like-counter`, `follow-button` are creator-UI overlays. Use ONLY when:

  brief.format == "portrait" OR audience reads as social-platform (TikTok
  scrollers, IG feed, gen-z, creator economy).

Stacking 3-4 social overlays is fine and typical for short-form video.

## Anti-patterns

- **Adding grain to a SaaS brief** — fights the polished feel.
- **Same block 3+ times in a row** — flat output.
- **Hand-fabricating brand hex** — leave undefined; fallbacks handle it.
