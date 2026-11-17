# Workflow films: motion direction

The first demo treated events as a slide deck. This revision treats the event as the focal object: establish the task, track it through the workflow, reveal the source receipt, compare the author's before/after framing, assemble the handoff, and close on the product.

References studied: [Snapcn](https://snapcn.dev/), especially its lead-word TextReveal, and [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts), especially motivated camera movement, foreground depth, reaction timing and proof-frame review. No reference artwork, characters, music or private style frames are copied. TextReveal is adapted under the adjacent MIT license; its measurement waits for the bundled font.

| Shot | Default frames | Lead movement | Supporting movement / hold |
|---|---:|---|---|
| Opening | 75 | Masked words settle into a large headline | Circular framing; copy holds after arrival |
| Event rail | 180 | Camera follows the source event sequence | Signal line draws; status and evidence change with the event |
| Receipt | 105 | Document arrives in perspective | Evidence mask opens, then source-status stamp lands |
| Comparison | 105 | Before card arrives, then after card responds | Cards hold for reading |
| Handoff | 75 | Three cards assemble with overlapping depth | Each card is a grouped entrance |
| Close | 90 | Snapcn lead word recedes and assembles | End frame holds; no fade to an empty frame |

All timing is editorial, not playback of source elapsed time. Events and status are never fabricated. The rail uses source order; receipts use the final output event, falling back explicitly when no output exists. The source disclaimer stays visible. Theme colors and imported projects remain supported. Portrait shots have a separate layout; square uses a centered landscape artboard without cropping.

## Architecture

`DirectedScene` provides the six directed compositions. `FeatureFilm` retains the existing timeline and dedicated comparison-of-runs/product-screenshot blocks. `TextReveal` is a source-owned component with no network fonts or runtime service. Every movement derives from the frame clock; scrubbing and rendering follow the same path.

## Verification

Run `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm build`. Render using `pnpm render:film`, or set `REMOTION_BROWSER_EXECUTABLE` to an installed compatible browser. Before publishing the sample, inspect the opening, each event transition, receipt, comparison, handoff and final hold in landscape and portrait. Do not claim visual QA from a successful typecheck alone.

Current verification: TypeScript, ESLint, 16 unit tests and the production build pass. Visual acceptance remains pending: local Chromium cannot launch under host socket restrictions; the downloaded headless shell reaches a restricted network-interface call. Remote transfer of uncommitted source was rejected by automatic approval review. The published MP4 is intentionally unchanged until render review is complete.
