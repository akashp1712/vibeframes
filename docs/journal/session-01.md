# Session 01 — M0: Origin & idea

**Date**: 2026-05-15
**Module**: M0 — Origin & idea
**Duration**: ~2 hr (planning + writing)

---

## What I built

- Created the `vibeframes/` project folder with a docs-first layout: `docs/`, `docs/decisions/`, `docs/lld/`, `docs/journal/`, `experiments/`, `assets/inspiration/`
- Wrote `docs/README.md` — the doc index with status table and module map
- Wrote `docs/00-origin-story.md` — the first real first-person doc; the HyperFrames-tweet-meets-Mastra-Harness origin, why I'm building this, what it is, what it isn't, and the build-in-public bet
- Wrote root `README.md` (points to docs) and `.gitignore`
- **No `package.json`. No `npm`. No code.** That's the point of M0.

## What I learned

- **Settling on a name was harder than I expected.** Went through `HyperStudio`, `HyperStudio-mini`, `hyperframes-studio` before landing on **VibeFrames** — which echoes both *HyperFrames* (the engine we sit on) and *vibe mode* (the single Mastra Harness mode we'll ship in MVP). The repeated `-Frames` suffix is the strongest connective tissue I could find.
- **The plan itself went through six revisions** before the first folder was created. That sounds excessive but was actually the most valuable part of M0 — every revision surfaced an assumption (LangGraph supervisor? no. Multi-agent routing? no. Block registry from scratch? no — HyperFrames already has one). The docs that come next are tighter because of it.
- **Reading the mc-studio-services Harness overview end-to-end** made me realise how much of "what an AI agent app needs" lives in the Harness boundary, not in the agent itself. State, memory, modes, workspace, side-channels, event subscribe — all of it lifted out of the agent into a runtime layer. That's the abstraction I want to learn.
- **HyperFrames is more than I assumed.** Skimming the repo I thought it was "HTML-to-video, neat". It's actually a six-package ecosystem with 50+ pre-built blocks, an agent-skill installer, and a deterministic render pipeline. My job isn't to build a video engine — it's to build a studio shell on top of one that already works.

## What surprised me

- HeyGen *ship agent skills as a product feature*. `npx skills add heygen-com/hyperframes` teaches Claude / Cursor / Codex how to write valid compositions. That's a meta-level: the framework's docs aren't just for humans, they're for the model. The Mastra Harness has a `workspace.skills` slot that's the receiving end of exactly that pattern. Both teams independently arrived at "skills are first-class".

## Pending / decided next

- **Diagram tooling decided**: [OpenFlowKit](https://openflowkit.com/) for hero diagrams (system context, Harness anatomy, SSE flow). Free, local-first, diagram-as-code DSL, BYO LLM key, SVG/PNG/Figma export, plus a cinematic MP4 export that's actually unique. Convention captured in `docs/README.md`: inline ASCII for quick sketches, SVG in `assets/diagrams/` for hero diagrams, MP4 for one or two launch artifacts only.
- **Tone of `README.md` + `00-origin-story.md` revised**: stripped autobiographical / build-in-public / learning-intent framing. Docs now read as "what this is" rather than "why I'm doing this".
- M1 next: install `@hyperframes/player` in `experiments/hyperframes-hello/`, render a static composition, and write the exploration doc that answers *"where exactly does an agent multiply this stack?"*
- Plan file lives at `~/.windsurf/plans/vibeframes-v6-eae326.md` (private to my machine — not committed).
- Repo is still local-only; will create the private GitHub remote in M1 or M2 and flip public after M7.

---

## LinkedIn-ready snippet (draft, for the public-launch post)

> A few weeks ago I saw HeyGen's CTO announce **HyperFrames** — "Write HTML. Render video. Built for agents." Same week I was deep in Mastra's `Harness` class at work. The two felt like halves of the same idea, so I'm building **VibeFrames** — a chat-first AI video studio where a Mastra-Harness agent composes HyperFrames videos for you. Building in public, docs-first. Eight docs and four ADRs are landing before a single `package.json`. Why? Because writing it down forces clarity.
