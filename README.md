# VibeFrames

**Your agent did the work. Let them see it.**

A workflow-film studio for AI automation agencies. Turn a reviewed set of execution events into an editable client-facing video: request, actions, human approval and source-reported outcome.

## Start

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `/create`. Try the illustrative sample, or import/paste normalized JSON using the downloadable example. Optionally import a previous run to create a source-bound change scene. Download a reviewed delivery record with source fingerprints and scene bindings. Edit the brief, compose six scenes, choose one of three formats and themes, review the source, and export. Drafts save locally; download the project JSON to keep a portable copy.

Browser export uses MP4 where supported and WebM otherwise. For a reliable MP4 render:

```sh
pnpm render:film
pnpm render:film ./vibeframes-project.json ./out/client-film.mp4
```

Optional OpenAI direction requires `OPENAI_API_KEY`; the studio works without it. AI calls send the reviewed brief and normalized events, not screenshots. See the architecture document before enabling AI on a hosted deployment.

- [Moat thesis, staged build and paid-pilot plan](docs/product-plan.md)
- [Product decision and competitive research](docs/product-research.md)
- [Architecture, setup and limitations](docs/architecture.md)

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

The earlier general-purpose editor remains at `/studio`. New workflow films use a separate validated source/story contract and a deterministic Remotion composition.
