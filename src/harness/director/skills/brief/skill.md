---
name: brief
description: How to write the strategic brief in YOLO single-turn mode. Inferring message + arc + audience + format + duration + narration without asking clarifying questions.
---

# Brief — extract the strategic frame

The Brief commits the ONE thing the video must communicate plus the
mechanical constraints (duration, format, narration y/n). All later
phases read it.

## Iron rules

- **Infer aggressively.** The user typed once. NEVER stall.
- **Real numbers, real names.** "12-second" → durationMs:12000.
  "Linear" → brand.name:"Linear". Canonical brand colors only —
  never fabricate hex.
- **One commit-brief call.** No drafts.

## Field cheat sheet

| field         | how to fill                                                    |
| ------------- | -------------------------------------------------------------- |
| message       | the ONE sentence the viewer should remember (≤25 words)        |
| arc           | reveal / problem-solution / demonstration / vibe / comparison  |
| audience      | who's watching (2-5 words: "engineering teams")                |
| format        | landscape (default) / portrait (TikTok/Reels) / square (IG)    |
| durationMs    | 5000-120000; infer from prompt or by type                      |
| narration     | full / minimal / none                                          |
| styleNotes    | verbatim user style language ("dark cinematic")                |
| brand.name    | when explicitly named                                          |
| brand.primaryColor | well-known canonical hex only (Linear=#5E6AD2, Stripe=#635BFF, Vercel none) — else omit |

## Inference defaults by prompt cue

```
"social ad" / "TikTok" / "Instagram"  → portrait, fast, durationMs:12000
"product demo" / "tour" / "walkthrough" → landscape, demo, durationMs:30000
"launch" / "teaser" / "reveal"          → landscape, reveal, durationMs:15000
"brand reel"                            → landscape, vibe, durationMs:20000
no narration cue + (social|teaser|reel) → narration:none|minimal
"narrated" / "VO" / "voiceover"         → narration:full
```

## Worked example

User: `make a 12-second product launch video for Linear, the issue tracker for engineering teams, dark cinematic, full narration`

Tool call:
```
commit-brief({
  message: "Linear ships fast because it gets out of your way.",
  arc: "reveal",
  audience: "engineering teams",
  format: "landscape",
  durationMs: 12000,
  narration: "full",
  styleNotes: "dark cinematic",
  brand: { name: "Linear", primaryColor: "#5E6AD2" }
})
```

Reply: `Brief committed: 12s reveal-arc launch for engineering teams.`

## Anti-patterns

- **Generic message.** "X is a great tool for businesses." Push for
  product-specific value prop.
- **Inventing colors.** Unknown brand → omit primaryColor. The
  validator will warn; the translator falls back to a tasteful gradient.
- **Asking the user.** No clarifying questions. Infer.
