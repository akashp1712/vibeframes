# DEVELOPMENT.md — Local Development Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | ≥ 20 | `node -v` |
| **pnpm** | ≥ 9 | `pnpm -v` |
| **Git** | any | `git --version` |

## Setup

```bash
git clone https://github.com/akashp1712/vibeframes.git
cd vibeframes
pnpm install
cp .env.example .env.local
```

Edit `.env.local` and set your `OPENAI_API_KEY`. Optionally set `VIBEFRAMES_MODEL` (defaults to `o4-mini`).

## Development Server

```bash
pnpm dev          # → http://localhost:3000 (Turbopack)
```

- **Landing page**: `http://localhost:3000`
- **Studio**: `http://localhost:3000/studio`

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint check |
| `pnpm test` | Run tests (single run) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Type-check without emit |

## Testing

We follow **test-driven development (TDD)**. Tests are written before implementation.

```bash
pnpm test          # run all tests once
pnpm test:watch    # re-run on file changes
```

- **Stack**: Vitest + React Testing Library + jsdom
- **Location**: `__tests__/` directories alongside source files
- **Naming**: `<component>.test.tsx` or `<module>.test.ts`
- **Workflow**: write test → see it fail → implement → green → refactor → commit

### Test structure

```
src/lib/__tests__/utils.test.ts
src/harness/__tests__/types.test.ts
src/harness/__tests__/config.test.ts
src/harness/__tests__/tools.test.ts
src/components/layout/__tests__/topbar.test.tsx
src/components/layout/__tests__/footer.test.tsx
src/components/landing/__tests__/feature-grid.test.tsx
src/components/studio/__tests__/studio-topbar.test.tsx
src/components/studio/__tests__/chat-message.test.tsx
src/components/studio/__tests__/preview-panel.test.tsx
src/components/studio/__tests__/code-panel.test.tsx
```

## Directory Structure

```
vibeframes/
├── src/                        ALL app code lives here
│   ├── app/                    Next.js App Router
│   │   ├── page.tsx            Landing page
│   │   ├── studio/page.tsx     3-pane Studio
│   │   ├── api/chat/route.ts   Chat API (SSE + AI SDK)
│   │   ├── layout.tsx          Root layout (Geist fonts, light mode)
│   │   └── globals.css         Design tokens + Tailwind v4 theme
│   ├── components/
│   │   ├── ui/                 shadcn/ui + MagicUI primitives (auto-generated)
│   │   ├── layout/             Topbar, Footer
│   │   ├── landing/            Hero, FeatureGrid, HowItWorks, TechStack
│   │   └── studio/             StudioTopbar, ChatPanel, PreviewPanel, CodePanel
│   ├── harness/                Mastra Harness types, config, tools
│   └── lib/                    Shared utilities (cn, etc.)
├── docs/                       Architecture docs, ADRs, journals
├── experiments/                Standalone experiments
├── .github/workflows/          CI (GitHub Actions)
├── AGENTS.md                   AI agent instructions
├── CLAUDE.md                   AI pair-programming protocol
└── DEVELOPMENT.md              This file
```

## Code Conventions

1. **`src/` directory** — all app code in `src/`, docs/experiments/configs at root
2. **Semantic tokens only** — `bg-primary`, `text-muted-foreground`, never raw hex
3. **`cn()` for classes** — import from `@/lib/utils`
4. **One concern per file** — extract at ~80 lines
5. **`render` prop for polymorphism** — not `asChild` (base-nova style)
6. **`nativeButton={false}`** on Button when rendering as `<a>` or `<Link>`
7. **`data-icon`** on icons inside Button — `"inline-start"` / `"inline-end"`
8. **`gap-*` not `space-*`** — always flex with gap
9. **Zod for runtime schemas** — all harness state, tool params, API payloads

## UI Design

- **Mode**: Light mode by default (like Vercel)
- **Primary**: Indigo (`oklch(0.49 0.22 264)`)
- **Fonts**: Geist Sans + Geist Mono
- **Components**: shadcn/ui (base-nova) + MagicUI (AnimatedShinyText, BorderBeam, ShimmerButton)
- **Micro-animations**: border beams on cards, shimmer on CTA, shiny text on badges

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for chat |
| `VIBEFRAMES_MODEL` | No | `o4-mini` | Model override |

## CI

GitHub Actions runs on push and PR to `main`:
- Install dependencies
- Type-check
- Run tests

See `.github/workflows/ci.yml`.

## Agent Skills

Skills are installed locally in the project (not globally). Install with:

```bash
npm_config_registry=https://registry.npmmirror.com npx skills add <owner/repo@skill> -y
```

Installed skills live in `.agents/` and are tracked in `skills-lock.json`.
