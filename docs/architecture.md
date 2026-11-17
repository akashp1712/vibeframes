# Workflow-film architecture

The new product lives in `/create`. `/studio` and its legacy harness are retained for compatibility; they are not the workflow-film pipeline.

## Boundaries

- `src/features/films/trace.ts`: versioned normalized source, bounded events, unique IDs, status, references and basic sensitive-pattern removal. Parsing strips unknown raw payloads and validates again after redaction. This is not comprehensive PII detection.
- `schema.ts`: validated brief, story, allowed block enum, local raster screenshots, formats and theme tokens. No generated code or remote media URL can enter the renderer.
- `director.ts`: optional Mastra agent using OpenAI structured output. Source events are data. Its output is a story, not executable React, and never replaces the source object.
- `FeatureFilm.tsx` and `TraceBlocks.tsx`: pure, frame-driven Remotion components. Evidence-bearing blocks read source fields directly. Editorial blocks read reviewed author/model copy. The same composition powers browser preview and exports.
- `FilmStudio.tsx`: import → review → compose/direct → edit → review → export. IndexedDB persists one draft on the device. JSON project download is the portable backup; there is no account, cloud project sync, or collaboration in this version.
- `/api/films/direct`: size-bounded input, explicit review, same-origin check, timeout/cancellation, schema validation and non-secret failure messages. It does not receive screenshots. Production Vercel calls are disabled unless explicitly enabled for a protected private preview.
- `/api/films/render`: single-job native fallback for local/self-hosted installations, disabled on Vercel serverless. It receives the reviewed project including images only when browser rendering is unavailable. Keep self-hosted access private.
- Browser renderer: MP4/H.264 when available, WebM/VP8 fallback, explicit failure if neither is supported. Browser rendering keeps source and images local; the native fallback sends them to this installation. Browser CSS/codec support varies; the CLI is the canonical MP4 fallback.

## Why this architecture

A limited vocabulary of carefully authored blocks gives stable layout, deterministic exports and source fidelity. Letting a model generate arbitrary components would increase security risk and make regression testing much harder. An agent framework is useful only at the editorial boundary here; a multi-agent research/render system would add latency and complexity without a demonstrated need.

Execution duration and film duration are different values. A 12-second approval can occupy one editorial beat; the film labels source-reported milliseconds. Error and pending states are retained. A missing output stays missing. No visual label establishes independent verification.

## Operating it

Use Node 22+ and the pinned pnpm version. Install with `pnpm install --frozen-lockfile`, run `pnpm dev`, visit `/create`. `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` are the checks. `pnpm render:film` renders the illustrative sample; `pnpm render:film ./vibeframes-project.json ./out/client-film.mp4` renders a reviewed project.

Remotion's CLI downloads Chrome Headless Shell. Linux needs Chromium system libraries (including NSS/NSPR, ATK, GBM and ALSA). Review Remotion's licensing terms for your intended team/commercial use; the player acknowledgement is not a purchased license.

For local AI, set `OPENAI_API_KEY` in `.env.local`; optionally set `VIBEFRAMES_FILM_MODEL` to a model your account supports. The application does not obtain API billing access from a ChatGPT subscription. On Vercel, only enable `VIBEFRAMES_PRIVATE_PREVIEW=true` behind deployment protection. That flag is not authentication. Before a public paid AI service, add authenticated users, durable quotas, abuse controls and billing. Never expose a shared billable API merely by turning on the flag.

## Tests and remaining product scope

Tests cover composition boundaries, invalid media/duration/variants, deterministic authored copy, removal of common sensitive patterns, duplicate IDs including post-redaction collisions, malformed runs, and error/pending preservation. Run actual provider evaluations once credentials are available; mocked tests or model catalog research are not quality evidence.

Not shipped: native n8n/Make/Zapier imports, voiceover, music, team accounts, cloud storage, billing, independently verified audit evidence or background render queues. The included film is intentionally silent. Introduce these only where pilot usage justifies them.
