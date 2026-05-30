# Session 09 — M8: Go Public + Core Scaffold

**Date**: 2026-05-26 → 2026-05-28  
**Module**: M8 — Scaffold + Studio UI + LLDs  
**Duration**: ~2 sessions (split across two days)  

## What shipped

### Go-public prep (2026-05-26)
- Rewrote root `README.md` — lead with implementation, not learning; premium shadcn-style wireframe mockup added
- Added MIT `LICENSE`
- Reframed `CLAUDE.md` for external readers
- Moved `plan.md` + `plan-continuation.md` into `docs/meta/`
- Cleaned internal language across docs
- Added HyperFrames website + CTO tweet references to docs 00 and 01
- Removed empty `assets/diagrams/` and `assets/inspiration/` — diagrams are inline ASCII

### Core scaffold (2026-05-28)
- **Project config**: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `components.json`
- **Next.js 16 app**: root layout (Geist fonts, light mode), landing page (`/`), studio page (`/studio`), API chat route (`/api/chat`)
- **Landing page**: Hero, FeatureGrid, HowItWorks, TechStack sections
- **Studio UI**: 3-pane layout — ChatPanel (with useChat), PreviewPanel, CodePanel + StudioTopbar
- **Harness scaffold**: `types.ts` (Zod schemas for Clip, Track, Composition, HarnessState), `config.ts` (model config, mode definitions), tool definitions (add-clip, update-clip, remove-clip)
- **Layout**: Topbar + Footer, shared across pages
- **shadcn/ui**: button, card, badge, input, textarea, separator, scroll-area, tooltip
- **MagicUI**: animated-shiny-text, border-beam, shimmer-button
- **Tests**: component tests (topbar, footer, feature-grid, how-it-works, tech-stack, studio-topbar, chat-message, preview-panel, code-panel), schema tests (types, config, tools), utility tests
- **CI**: GitHub Actions workflow (typecheck + test on push/PR)
- **DX**: prettier, husky, lint-staged
- **LLD-01** — App structure (folder conventions, import rules, testing structure)
- **LLD-02** — Composition model (types, mutation plan, serialization spec, clip registry roadmap)
- **AGENTS.md + DEVELOPMENT.md** — AI agent instructions + local dev guidelines

## Key decisions

1. **`src/` directory** — all app code in `src/`, not flat root. Path alias `@/*` → `./src/*`.
2. **MagicUI over Kibo/Aceternity** — dropped Kibo UI and Aceternity from the component stack. shadcn/ui + MagicUI covers all needs.
3. **3-pane Studio** (Chat + Preview + Code) instead of original 4-pane (asset lib, preview, timeline, properties). Chat is a full panel, not a drawer.
4. **Composition mutations deferred to M9** — tool param schemas exist, but pure mutation functions ship with the harness loop.
5. **`/sandbox` deferred to M9** — preview will be integrated into studio PreviewPanel when mutations are ready.
6. **Geist Sans + Geist Mono** typography — dropped Inter + Instrument Serif pairing from M7 exploration in favor of Next.js-native Geist family.

## Verification

- `pnpm dev` — landing page and studio page render correctly
- `pnpm typecheck` — zero errors
- `pnpm test` — all component, schema, and tool tests pass
- Manual smoke: chat panel sends messages to `/api/chat`, studio 3-pane layout responsive

## Risks

- **No HyperFrames player in-app yet** — deferred to M9. The experiments/ folder has a working CDN-based demo.
- **Tool definitions are schema-only** — no `execute()` functions until Mastra Harness is wired in M9.

## Next session

- Theme refinement: apply Soothing Ocean Slate branding
- Landing page: integrate live HyperFrames promo player
