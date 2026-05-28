# AGENTS.md — VibeFrames

Instructions for AI coding agents working on this repository.

## Project

VibeFrames is a Mastra Harness agent that composes HyperFrames videos through
conversation. The UI is a Next.js 16 app with a 3-pane Studio (chat, preview,
code) at `/studio`.

## Stack

- **Runtime**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, shadcn/ui (base-nova), MagicUI
- **AI**: AI SDK v4, @ai-sdk/openai, @ai-sdk/react
- **Agent**: Mastra Harness (planned — types scaffolded in `src/harness/`)
- **Package manager**: pnpm

## Directory Layout

```
src/                  ← ALL app code lives here
  app/
    page.tsx          → Landing page (/, light mode default)
    studio/page.tsx   → 3-pane Studio (/studio)
    api/chat/         → Chat API route (SSE + AI SDK)
  components/
    ui/               → shadcn/ui + MagicUI primitives (do not edit directly)
    layout/           → Topbar, Footer — shared across pages
    landing/          → Hero, FeatureGrid, HowItWorks, TechStack — landing page
    studio/           → StudioTopbar, ChatPanel, PreviewPanel, CodePanel
  harness/
    types.ts          → Zod schemas for state, composition, clips
    config.ts         → Constants, model config, mode definitions
    tools/            → Tool definitions (add-clip, update-clip, remove-clip)
    index.ts          → Barrel exports
  lib/                → Shared utilities (cn, etc.)
docs/                 → Architecture docs, ADRs, session journals (NOT in src/)
experiments/          → Standalone experiments (NOT in src/)
```

## Rules

1. **`src/` directory** — all app code lives in `src/`. Docs, experiments, configs stay at root.
2. **Use shadcn components** — never build raw divs for buttons, cards, inputs.
   Use `render` prop (not `asChild`) for base-nova polymorphism.
3. **Semantic tokens only** — `bg-primary`, `text-muted-foreground`, never raw
   hex or `bg-blue-500`.
4. **`cn()` for conditional classes** — import from `@/lib/utils`.
5. **One concern per file** — no god-files. Extract when a component exceeds
   ~80 lines.
6. **Minimal comments** — let code speak. Document *why*, not *what*.
7. **Barrel exports** — each directory with 2+ modules gets an `index.ts`.
8. **Zod for runtime schemas** — all harness state, tool params, API payloads.
9. **`data-icon` on icons** — per shadcn rules: `data-icon="inline-start"` /
   `"inline-end"` on icons inside Button. No sizing classes on icons in
   components.
10. **`gap-*` not `space-*`** — always flex with gap, never space-x/space-y.

## Testing — TDD Required

**Test-first development**: write tests before implementation. Tests are the
spec. No hacky solutions — production-ready code only.

- **Stack**: Vitest + React Testing Library + jsdom
- **Run**: `pnpm test` (single run) / `pnpm test:watch` (watch mode)
- **CI**: GitHub Actions on push/PR
- **Workflow**: test → implement → green → refactor → commit
- **Coverage**: every component, harness type, API route, and util must have tests

## Environment

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY`.
