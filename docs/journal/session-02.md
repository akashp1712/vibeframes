# Session 02 — M1: HyperFrames Exploration

## Goal for this session
- Understand HyperFrames end-to-end and document findings.
- Create a minimal experiment validating the HTML-native composition model.

## Planned scope
- In: exploration doc, CDN-based player experiment, package inventory, agent skills survey, "where does an agent help?" analysis
- Out: npm install, MP4 rendering, full CLI workflow, nested compositions

## What changed
- Docs: `docs/01-hyperframes-exploration.md` — 11-section exploration covering what HyperFrames is, data attributes, package inventory, clip types, block catalog (50+ items cataloged), agent skills, the 7-step pipeline, player web component, HyperFrames vs Remotion, where an agent helps, and key takeaways for VibeFrames.
- Code: `experiments/hyperframes-hello/` — a pure HTML spike (no package.json) with a 6-second GSAP-animated composition and CDN-loaded `<hyperframes-player>`. Three tracks: gradient background, title fade-in, subtitle entrance.
- Decisions: none new (no ADR-worthy forks in this module).

## Verification
- Commands run: none (docs-only module, experiment is a static HTML file)
- Manual smoke: open `experiments/hyperframes-hello/index.html` via local server (`npx serve .`) to verify player loads and animates the composition
- Result: pending user verification

## Risks / open questions
- Player via CDN requires a local server (CORS blocks file:// fetch of composition.html) — documented in experiment README.
- GSAP gradient animation (`tl.to("#bg", { background: ... })`) may not be fully seekable — needs verification during preview. Fallback: use CSS custom properties or static gradient.
- HyperFrames requires Node 22+ for CLI/rendering — need to confirm user's Node version before M8.

## Next session start point
- First action: write `docs/02-mastra-primer.md` (M2)
- Expected output: primer doc covering AI SDK → LLM → Agent → Tools → Workflows → Memory, with code snippets per concept
