# experiments/hyperframes-hello

Minimal spike to validate HyperFrames' HTML-native composition model.

## What's here

- **`composition.html`** — a 6-second composition with three tracks (background, title, subtitle) animated with GSAP. No external media, pure HTML + CSS.
- **`index.html`** — host page embedding `<hyperframes-player>` via CDN to play the composition.

## How to run

Open `index.html` in a browser. The player loads the composition in an isolated iframe and plays it with controls.

> **Note:** The player loads `composition.html` via fetch, so you need a local server (file:// won't work due to CORS). Quickest way:
>
> ```bash
> npx serve .
> ```
>
> Then open the URL it prints (usually `http://localhost:3000`).

## What this validates

1. Data attributes (`data-start`, `data-duration`, `data-track-index`) control timing and layering.
2. GSAP timelines registered on `window.__timelines` are seekable by the player.
3. `<hyperframes-player>` embeds via CDN with zero npm dependencies.
4. Composition CSS/JS is isolated from the host page (Shadow DOM + iframe).

## Not tested here

- Video/audio media clips (no FFmpeg dependency for this spike)
- `npx hyperframes render` (requires Node 22+ and FFmpeg)
- Nested compositions via `data-composition-src`
- Block catalog (`npx hyperframes add`)
