---
name: storyboard
description: How to plan beats. Concept-first decomposition, shot grammar, camera moves, technique counts, duration math, and the canonical anti-patterns (logo-headline×3, settled holds, browser chrome).
---

# Storyboard — concept-first beat planning

The Storyboard converts the brief into beats. Every beat is a SHOT, not
a layout: it has a concept, a shot type, a camera move, ≥2 techniques,
and block hints. Compose phase reads this and emits clips via the
translator — there's no creative choice in Compose, only in Storyboard.

## Iron rules

1. **Concept-first.** "The product solves the chaos" is a concept.
   "Show the kanban" is a layout. Beats lead with concept.
2. **Two techniques per beat or it's a slideshow frame.**
   `techniques: ["scale-in"]` is rejected. Two minimum.
3. **Durations sum to brief.durationMs ± 500ms.** Pick rhythm first,
   pace beats to fit. Adjust + retry if commit fails.
4. **Indices 1..N sequentially.** No gaps.
5. **Camera moves matter.** Don't write `static` on every beat.

## Pacing → beat count

```
   rhythm     beats   beat dur     when to pick
   ────────   ─────   ──────────   ──────────────────────────────────
   fast       8-15    700-1800ms   "punchy social ad", "rapid cuts"
   moderate   4-6     3000-5000ms  "demo", "tour", "narrated"
   slow       3-4     5000-8000ms  "cinematic", "premium", "breathing"
   arc        5-7     varies       "launch", "story", "narrative"
```

For a 12s reveal-arc launch: rhythm:"arc", beats:5, durations roughly
[1500, 2500, 3000, 2500, 2500] = 12000.

## Shot types (closed set)

```
   extreme-close  one element fills 60-90% (a number, a cursor, a button)
   close          one element fills 40-60% (a card, a code block)
   medium         a UI section fills 60-80% (kanban, chat, dashboard)
   wide           full UI at 70-90% — establishing shots only
   over-the-shoulder  device foreground, UI midground
   dutch-angle    tilted 4-8° for tension
```

Wide is the rare establishing shot. A 80% wide storyboard is a
slideshow. Healthy distribution: 60% close + 20% medium + 10% wide
+ 10% extreme.

## Camera moves (required)

```
   dolly-in     scale 1.0 → 1.08 over the beat (default for product holds)
   dolly-out    scale 1.15 → 1.0 (revealing more)
   push         fast scale-up on a key moment
   parallax     bg drifts opposite to fg
   orbit        subject rotates in 3D
   rack-focus   blur shifts between elements
   static       only when explicitly justified (a single number, a logo at rest)
```

NEVER all-static. NEVER more than one static in a row.

## Block hints

After calling `list-blocks`, populate each beat's `blockHints` with
1-3 catalog block ids that the translator can use. Pick by the beat's
purpose:

```
   opener / hook        hero-title, kinetic-words, logo-headline
   feature reveal       split-screen, stats-callout
   social proof         quote-pull
   CTA                  cta-button
   closer               end-card
   layered overlay      lower-third, social-avatar, hashtag-pill
   filmic vibe          grain-overlay (top track, brief-justified only)
```

A beat can hint multiple blocks (translator layers them: bg + main
block + optional overlay). One block id per scene-purpose is normal.

## Anti-patterns (do not ship)

1. **logo-headline × 3.** Three identical title scenes is the canonical
   "too basic" output. Vary blocks across beats.
2. **Settled holds longer than 1.5s with no compositional change.**
   Add a camera dolly or parallax layer.
3. **Browser chrome / sidebars / page footers.** Videos aren't webpages.
   No traffic-light dots, no nav rails, no centered cards with even
   margins. UNLESS the beat IS specifically about that chrome.
4. **One technique listed.** Schema rejects.
5. **Empty narration when brief.narration = "full".** Every beat needs
   a voCue when full VO is asked.

## Worked example

For brief: 12000ms reveal-arc launch for Linear, dark cinematic.

```
commit-storyboard({
  storyboard: {
    rhythm: "arc",
    beats: [
      { index: 1, concept: "Spark in darkness — moment before the brand emerges.",
        shotType: "extreme-close", cameraMove: "dolly-in",
        techniques: ["radial glow bloom", "grain overlay"],
        blockHints: ["background-fill"],
        voCue: "You shipped it.", durationMs: 1500,
        built: false, clipIds: [] },
      { index: 2, concept: "Brand wordmark draws across the frame.",
        shotType: "medium", cameraMove: "push",
        techniques: ["svg path draw", "accent line sweep"],
        blockHints: ["hero-title"],
        voCue: "Linear.", durationMs: 2500,
        built: false, clipIds: [] },
      { index: 3, concept: "Three feature panels reveal, parallaxed in layers.",
        shotType: "wide", cameraMove: "parallax",
        techniques: ["staggered card entrance", "kinetic type"],
        blockHints: ["split-screen"],
        voCue: "Issues, projects, cycles.", durationMs: 3000,
        built: false, clipIds: [] },
      { index: 4, concept: "Stat callout — speed metric snaps in.",
        shotType: "extreme-close", cameraMove: "push",
        techniques: ["counter increment", "accent flash"],
        blockHints: ["stats-callout"],
        voCue: "Built for the team.", durationMs: 2500,
        built: false, clipIds: [] },
      { index: 5, concept: "Wordmark + tagline closer.",
        shotType: "close", cameraMove: "dolly-out",
        techniques: ["logo breathing", "fade to brand"],
        blockHints: ["end-card"],
        voCue: "linear.app", durationMs: 2500,
        built: false, clipIds: [] },
    ],
  }
})
```

Sum: 1500+2500+3000+2500+2500 = 12000 ✓

Reply: `Storyboard committed: 5 beats, arc rhythm — spark → wordmark → panels → stat → close.`
