# VibeFrames Catalog — Live Inventory

> **Status**: living doc. Update this whenever you add, remove, or change a block in the registry. Anything in `src/harness/services/clip-registry.service.ts` but missing here is a bug — keep them in sync.

This is the **single source of truth for "what can the agent draw today?"**. Use it to:

- Sanity-check before adding a new block (is there overlap?)
- Onboard a future contributor (or your future self) in 60 seconds
- Plan promotions from Tier 2/3 catalog ideas to Tier 1

## At a glance

| Surface | Count | Source of truth |
|---|---:|---|
| Blocks (`list-blocks`) | **20** | `src/harness/services/clip-registry.service.ts` |
| Transitions | **0** | deleted in M10 cleanup — see [`docs/lld/lld-08-phased-director.md`](../lld/lld-08-phased-director.md) status note. Restoration plan lives in MVP 2.0 (see [`plan.md` §4.5](./plan.md)). |
| Caption styles | 0 | planned — see [`lld-07-captions.md`](../lld/lld-07-captions.md). MVP 2.0/3.0. |

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
| `kinetic-words` | composition | title | `word1`, `word2`, `word3` | Three-word punch, middle word accented (locked at 8xl — see MVP 1.0.1 backlog) |
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

Small absolute-positioned overlays for TikTok / IG / X / YouTube vibes. Track 3+. **Hard-coded anchors today** — see MVP 1.0.1 backlog (refactor to use an `anchor` enum like `subtitle-anchor`).

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

## Transitions (deleted in M10 cleanup)

The `transition-registry.service.ts`, `add-transition` tool, and `skills/transitions/` were deleted during M10 codebase cleanup — the agent never planned transitions and the translator never consulted the registry, so the surface was dead weight. Git history preserves the previous Tier 1/2/3 inventory if needed.

Restoration plan: **MVP 2.0** ships a small CSS-transition surface (cut, fade, push, blur) wired into the translator, not as a separate registry. **MVP 4.0** ports 3 shader transitions (sdf-iris, domain-warp, whip-pan) from `@hyperframes/shader-transitions`. See [`plan.md` §4.5](./plan.md) and [`docs/analysis/hyperframes-vs-vibeframes.md`](../analysis/hyperframes-vs-vibeframes.md) §5.2 / §5.4.

---

## How to keep this doc honest

When you change the registry:

1. Update `src/harness/services/clip-registry.service.ts`.
2. Update the matching table here. Bump the **At a glance** count.
3. Run `pnpm test` — registry tests assert minimum block count and var-template parity.
4. Mention the change in the next `docs/journal/` entry — one line is enough.

---

## Where else this is described

- [`docs/harness-architecture.md`](../harness-architecture.md) — runtime SSOT (catalog vs skills, "how to add a block" recipe).
- `src/harness/director/skills/design/skill.md` — agent-facing pick-a-block guidance.
- `src/harness/director/skills/storyboard/skill.md` — when to plan beats around which categories.
- [`docs/meta/future-roadmap.md`](./future-roadmap.md) — backlog for new blocks beyond MVP 1.0.

Skill files focus on **how to pick** (the agent's needs). This doc focuses on **what exists** (your needs as the builder). Both stay accurate; both link to each other.
