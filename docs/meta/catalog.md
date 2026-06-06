# VibeFrames Catalog — Live Inventory

> **Status**: living doc. Update this whenever you add, remove, or change a block or transition in the registry. Anything in the registries (`src/harness/services/clip-registry.service.ts`, `src/harness/services/transition-registry.service.ts`) but missing here is a bug — keep them in sync.

This is the **single source of truth for "what can the agent draw today?"**. Use it to:

- Sanity-check before adding a new block (is there overlap?)
- Plan promotions from Tier 2/3 stubs to Tier 1
- Write LinkedIn / journal posts that brag accurately
- Onboard a future contributor (or your future self) in 60 seconds

## At a glance

| Surface | Count | Source of truth |
|---|---:|---|
| Blocks (`get-block-schemas`) | **20** | `src/harness/services/clip-registry.service.ts` |
| Transitions (`get-transition-schemas`) | **23** (18 Tier 1 · 2 Tier 2 · 3 Tier 3) | `src/harness/services/transition-registry.service.ts` |
| Caption styles | 0 | planned — see `docs/lld/lld-07-captions.md` |

---

## Blocks (20)

Each block has a **`kind`**:

- **`unit`** — atomic, designed to layer with peers on adjacent tracks (backgrounds, overlays, social, effects).
- **`composition`** — self-contained full-scene block. One clip = one beat.

### Atomic units — canonical 3-clip pattern (3)

The vercel-intro pattern lives here: bg → title → subtitle, stacked across three tracks for the same time range.

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `background-fill` | unit | background | `bgClass` | Track-0 base of every composition |
| `logo-headline` | unit | title | `logoUrl`, `title` | Track-1, layered over `background-fill` |
| `subtitle-anchor` | unit | lower-third | `text`, `anchor` | Track-2, anchored top / centre / bottom |

### Composition blocks — single-clip full scenes (7)

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `hero-title` | composition | title | `title` | Big centred headline on dark gradient |
| `kinetic-words` | composition | title | `word1`, `word2`, `word3` | Three-word punch, middle word accented |
| `split-screen` | composition | scene | `heading`, `subheading` (+ optional `accent`) | Text-left / panel-right product reveal |
| `stats-callout` | composition | stats | `number`, `label` | Single giant metric |
| `quote-pull` | composition | quote | `quote`, `attribution` | Testimonial / mission statement |
| `cta-button` | composition | cta | `headline`, `cta` | Closing-beat pill button |
| `end-card` | composition | end | `brand`, `tagline`, `url` | Final brand wordmark + URL |

### Overlay units — lower-thirds (1)

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `lower-third` | unit | lower-third | `name`, `role` | Bottom-left name + role banner; track 2+ |

### Social overlay units (5)

Small absolute-positioned overlays for TikTok / IG / X / YouTube vibes. Track 3+.

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `social-avatar` | unit | social | `avatarUrl`, `displayName`, `handle` | Top-left attribution |
| `mention-card` | unit | social | `handle`, `tagline` | Bottom-right floating @mention |
| `hashtag-pill` | unit | social | `tag` | Bottom-centre `#hashtag` pill |
| `comment-bubble` | unit | social | `avatarUrl`, `handle`, `body` | Left-centre faux comment |
| `like-counter` | unit | social | `likes`, `comments`, `shares` | Right-centre TikTok engagement column |

### Follow CTA units (2)

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `follow-button` | unit | follow | `handle` | Bold bottom-centre "Follow @handle" pill |
| `follow-arrow` | unit | follow | `label` | Animated `↘` pointing at follow button |

### Effect overlay units (2)

Full-frame cosmetic washes. Top-most track. No copy.

| Id | Kind | Category | Required vars | Notes |
|---|---|---|---|---|
| `grain-overlay` | unit | effect-overlay | `intensity` | Filmic grain + vignette |
| `scanlines-overlay` | unit | effect-overlay | `opacityClass` | CRT scanlines with pulse |

---

## Transitions (23)

Each transition has a **tier**:

- **Tier 1** — shipped, has a `template`, materialises via `add-transition`.
- **Tier 2** — catalog stub, planned. Agent can *see* it via `get-transition-schemas` but `add-transition` refuses until a `template` is added.
- **Tier 3** — VFX, registry-backed (`hyperframes-registry/*`). Waiting on install pipeline.

### Tier 1 — shipped (18)

| Id | Kind | Default ms | Required vars | When to use |
|---|---|---:|---|---|
| `cut` | cut | 0 | — | Hard editorial boundary; declares the cut without an overlay |
| `fade` | fade | 500 | — | Gentle handoff between similar scenes |
| `fade-through-black` | fade | 600 | — | Scene change as a paragraph break |
| `fade-through-white` | fade | 500 | — | Upbeat brand reveal |
| `slide-left` | slide | 500 | `bgClass` | Horizontal page-turn feel |
| `slide-up` | slide | 500 | `bgClass` | Vertical-feed (social) compositions |
| `slide-stack` | slide | 600 | `bgClass` | Cards stacking — coloured panel with shadow edge slides across |
| `zoom-in` | zoom | 400 | — | Punch / beat-sync between dramatic moments |
| `zoom-out` | zoom | 400 | — | Camera-flash between still moments |
| `zoom-punch-in` | zoom | 500 | `bgClass` | Beat-sync punch — colour panel scales 0→1→1.5 with flash |
| `zoom-punch-out` | zoom | 500 | `bgClass` | Mirror of `zoom-punch-in` — scales 1.5→1→0, falling-away feel |
| `wipe-circle` | wipe | 600 | `bgClass` | Camera-iris reveal — circle grows from centre to fill the frame |
| `wipe-diagonal` | wipe | 500 | `bgClass` | Energetic diagonal band sweeps across — sports-reel feel |
| `wipe-checker` | wipe | 700 | `bgClass` | 4×4 tile grid flashes on with a diagonal stagger — retro / game-show feel |
| `iris-open` | wipe | 700 | `bgClass`, `anchor` | Camera-iris opens from an anchor point — coloured fill shrinks to a pinhole |
| `iris-close` | wipe | 700 | `bgClass`, `anchor` | Camera-iris closes onto an anchor point — coloured fill blooms from the anchor |
| `blur-bridge` | blur | 600 | — | Dream / introspective — real backdrop-filter blur pulse |
| `glitch-cut` | blur | 350 | — | Brief RGB-split + white flash — tech / cyberpunk / data-corruption feel |

### Tier 2 — catalog stubs (2)

Only the SVG-morph pair remains. Both need path tweening which is a poor fit for the inline-template Tier 1 contract. They likely move to the Tier 2 sub-composition architecture (`add-block { blockId, vars }`) rather than getting promoted in-place.

| Id | Kind | Default ms | Tier-1 fallback |
|---|---|---:|---|
| `morph-shapes` | morph | 800 | `blur-bridge` |
| `morph-type` | morph | 900 | `blur-bridge` |

### Tier 3 — VFX stubs (3)

Backed by `hyperframes-registry` packages. Waiting on install pipeline.

| Id | Kind | Default ms | Tier-1 fallback |
|---|---|---:|---|
| `vfx-shatter` | vfx | 900 | `fade-through-black` |
| `vfx-liquid` | vfx | 1000 | `fade-through-black` |
| `vfx-portal` | vfx | 1100 | `fade-through-white` |

---

## How to keep this doc honest

When you change the registry:

1. Update the file (one of `clip-registry.service.ts`, `transition-registry.service.ts`).
2. Update the matching table here. Bump the **At a glance** counts.
3. Update `docs/meta/future-roadmap.md` item #1 if the totals shift.
4. Run `pnpm test` — the registry tests assert minimum counts (≥ 20 blocks, ≥ 20 transitions, every id in `TIER_1_IDS` present, ≥ 2 Tier 2 stubs remaining). Bump assertions if you change the floor.
5. Mention the change in the next `docs/journal/` entry — one line is enough.

Promotion from Tier 2 → Tier 1: add `template` + `vars` to the transition entry, flip `tier: 2` → `tier: 1`, update this table, drop the fallback row.

---

## Where else this is described

- `src/harness/skills/hyperframes/skill.md` — universal composition foundation (render contract, layout, typography, timing).
- `src/harness/skills/blocks/skill.md` — agent-facing block reference (atomic units + compositions + lower-thirds), 3-clip pattern.
- `src/harness/skills/social-overlays/skill.md` — agent-facing social UI reference (TikTok / IG / X overlays, track 3+ conventions).
- `src/harness/skills/effects/skill.md` — agent-facing effect reference (grain, scanlines, top-most-track rule).
- `src/harness/skills/transitions/skill.md` — agent-facing transition reference + timing rules.
- `docs/meta/future-roadmap.md` (item #1) — roadmap context, why we tier transitions.
- `docs/lld/lld-07-captions.md` — captions catalog, when it lands.

Skill files focus on **how to pick** (the agent's needs). This doc focuses on **what exists** (your needs as the builder). Both stay accurate; both link to each other.
