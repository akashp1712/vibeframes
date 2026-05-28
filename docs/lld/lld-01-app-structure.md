# LLD-01 — App Structure

> **TL;DR** — VibeFrames is a Next.js 16 app with all code in `src/`. Components are grouped by concern (layout, landing, studio, ui), the harness lives alongside them, and every module follows strict conventions for imports, exports, naming, and testing. Docs, experiments, and configs stay at root. This LLD is the single source of truth for folder layout, file conventions, and import rules.

---

## 1. Directory Tree

```
vibeframes/
│
├── src/                              ALL app code lives here
│   ├── app/                          Next.js App Router
│   │   ├── layout.tsx                Root layout (Geist fonts, light mode)
│   │   ├── globals.css               Design tokens + Tailwind v4 theme
│   │   ├── page.tsx                  Landing page (/)
│   │   ├── studio/
│   │   │   └── page.tsx              3-pane Studio (/studio)
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts          Chat API (SSE + AI SDK streamText)
│   │
│   ├── components/
│   │   ├── ui/                       ◁ shadcn/ui + MagicUI primitives
│   │   │   ├── button.tsx               (auto-generated — do NOT hand-edit)
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── animated-shiny-text.tsx
│   │   │   ├── border-beam.tsx
│   │   │   ├── shimmer-button.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   ◁ Shared navigation
│   │   │   ├── topbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── __tests__/
│   │   │       ├── topbar.test.tsx
│   │   │       └── footer.test.tsx
│   │   │
│   │   ├── landing/                  ◁ Landing page sections
│   │   │   ├── hero.tsx
│   │   │   ├── feature-grid.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── tech-stack.tsx
│   │   │   └── __tests__/
│   │   │       ├── feature-grid.test.tsx
│   │   │       ├── how-it-works.test.tsx
│   │   │       └── tech-stack.test.tsx
│   │   │
│   │   └── studio/                   ◁ Studio page components
│   │       ├── studio-topbar.tsx
│   │       ├── chat-panel.tsx
│   │       ├── chat-message.tsx
│   │       ├── preview-panel.tsx
│   │       ├── code-panel.tsx
│   │       └── __tests__/
│   │           ├── studio-topbar.test.tsx
│   │           ├── chat-message.test.tsx
│   │           ├── preview-panel.test.tsx
│   │           └── code-panel.test.tsx
│   │
│   ├── harness/                      ◁ Mastra Harness runtime
│   │   ├── types.ts                  Zod schemas (state, composition, clips)
│   │   ├── config.ts                 Constants, model config, mode definitions
│   │   ├── tools/
│   │   │   ├── add-clip.ts
│   │   │   ├── update-clip.ts
│   │   │   ├── remove-clip.ts
│   │   │   └── index.ts              Barrel export
│   │   ├── index.ts                  Barrel export
│   │   └── __tests__/
│   │       ├── types.test.ts
│   │       ├── config.test.ts
│   │       └── tools.test.ts
│   │
│   └── lib/                          ◁ Shared utilities
│       ├── utils.ts                  cn() helper
│       └── __tests__/
│           └── utils.test.ts
│
├── docs/                             ◁ Architecture docs, ADRs, journals
│   ├── lld/                      Low-level design documents
│   ├── decisions/                ADRs
│   ├── journal/                  Session journals
│   └── meta/                     Build plan + execution protocol
│
├── experiments/                  ◁ Standalone spikes (NOT the main app)
│   └── hyperframes-hello/
│       ├── index.html
│       └── composition.html
│
├── .github/workflows/ci.yml     ◁ CI: typecheck + test
├── AGENTS.md                     AI agent instructions
├── CLAUDE.md                     AI pair-programming protocol
├── DEVELOPMENT.md                Local dev guidelines
└── README.md                     Project overview
```

---

## 2. Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER                                      │
│                                                                     │
│  ┌──────────┐   GET /    ┌──────────────────────────────────┐       │
│  │  User    │ ─────────► │  Landing Page (/)                │       │
│  │          │            │  Topbar → Hero → Features →      │       │
│  │          │            │  HowItWorks → TechStack → Footer │       │
│  │          │            └──────────────────────────────────┘       │
│  │          │                                                       │
│  │          │  /studio   ┌──────────────────────────────────┐       │
│  │          │ ─────────► │  Studio Page (/studio)           │       │
│  │          │            │  ┌─────────┬──────────┬────────┐ │       │
│  │          │            │  │  Chat   │ Preview  │  Code  │ │       │
│  │          │            │  │  Panel  │  Panel   │  Panel │ │       │
│  │          │            │  └────┬────┴──────────┴────────┘ │       │
│  └──────────┘            └──────┼───────────────────────────┘       │
│                                 │                                   │
│                     useChat()   │  SSE                              │
│                                 ▼                                   │
│                          ┌──────────────┐                           │
│                          │  /api/chat   │  Route Handler             │
│                          │  streamText  │  (AI SDK)                  │
│                          └──────┬───────┘                           │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │   OpenAI     │
                          │   o4-mini    │
                          └──────────────┘
```

---

## 3. Import Rules

### Path aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

All imports use `@/` alias from `src/`. Never relative `../../`.

### Import order

1. **React / Next.js** — `react`, `next/link`, `next/font`
2. **External deps** — `ai`, `zod`, `lucide-react`, `sonner`
3. **UI primitives** — `@/components/ui/*`
4. **App components** — `@/components/layout/*`, `@/components/landing/*`, `@/components/studio/*`
5. **Harness** — `@/harness/*`
6. **Lib** — `@/lib/*`

### Barrel exports

Every directory with 2+ modules has an `index.ts`:

```ts
// harness/tools/index.ts
export { addClipTool } from "./add-clip";
export { updateClipTool } from "./update-clip";
export { removeClipTool } from "./remove-clip";
```

Consumers import from the barrel, not individual files:

```ts
// ✅ Good
import { addClipTool, CompositionSchema } from "@/harness";

// ❌ Bad
import { addClipTool } from "@/harness/tools/add-clip";
```

---

## 4. Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| **Route files** | `page.tsx`, `layout.tsx`, `route.ts` | `src/app/studio/page.tsx` |
| **Components** | PascalCase export, kebab-case file | `studio-topbar.tsx` → `StudioTopbar` |
| **Schemas** | PascalCase + `Schema` suffix | `ClipSchema`, `HarnessStateSchema` |
| **Types** | PascalCase, inferred from schema | `type Clip = z.infer<typeof ClipSchema>` |
| **Tools** | camelCase + `Tool` suffix | `addClipTool` |
| **Tests** | `<source>.test.tsx` in `__tests__/` | `__tests__/studio-topbar.test.tsx` |
| **Docs** | `lld-NN-slug.md`, `ADR-NNN-slug.md` | `lld-01-app-structure.md` |

---

## 5. Component Rules

### shadcn/ui (base-nova)

- **Never hand-edit** files in `components/ui/`. Use `pnpm dlx shadcn add <component>`.
- Polymorphism via `render` prop, NOT `asChild`:
  ```tsx
  <Button render={<Link href="/studio" />}>Open Studio</Button>
  ```
- Add `nativeButton={false}` when rendering as `<a>` or `<Link>`.
- Icons use `data-icon="inline-start"` / `"inline-end"` inside Button. No sizing classes on icons.

### Styling

- **Semantic tokens only** — `bg-primary`, `text-muted-foreground`, never raw hex
- **`cn()` for conditional classes** — import from `@/lib/utils`
- **`gap-*` not `space-*`** — always flex/grid with gap
- Design tokens defined in `app/globals.css` under `:root` (light) and `.dark` (dark)

### File size

One concern per file. Extract when a component exceeds ~80 lines. The `ChatPanel` is ~100 lines because it includes an inline `ChatEmptyState` — that's the upper limit.

---

## 6. Testing Structure

```
┌─────────────────────────────────────────────────────┐
│                    TEST PYRAMID                      │
│                                                     │
│                     ┌─────┐                         │
│                     │ E2E │  (M12 — Playwright)     │
│                    ─┤     ├─                        │
│                   / └─────┘ \                       │
│                  /           \                      │
│              ┌──────────────────┐                   │
│              │   Component      │  ◁ RTL + jsdom    │
│              │   Tests          │    (current)      │
│              ├──────────────────┤                   │
│              │ Schema / Tool    │  ◁ Pure Vitest    │
│              │ Unit Tests       │    (current)      │
│              └──────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

- **Stack**: Vitest + React Testing Library + jsdom
- **Location**: `__tests__/` sibling to source
- **TDD workflow**: test → implement → green → refactor → commit
- **Run**: `pnpm test` (CI) / `pnpm test:watch` (dev)
- **CI**: GitHub Actions — typecheck + test on push/PR

### Known patterns

- shadcn Card / Badge components duplicate text nodes → use `container.textContent.toContain()` instead of `screen.getByText()`
- Base UI `nativeButton` warning → add `nativeButton={false}` when `render` prop is non-button
- `document.querySelector()` for link assertions (href-specific)

---

## 7. Environment & Config

| File | Purpose |
|------|---------|
| `.env.example` | Template — copy to `.env.local` |
| `.env.local` | Local secrets (gitignored) |
| `next.config.ts` | Turbopack root, transpilePackages |
| `tsconfig.json` | `@/*` path alias, strict mode |
| `vitest.config.ts` | jsdom environment, `@` → `src/` alias |
| `components.json` | shadcn configuration |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |

---

## 8. What's NOT Here Yet (M9+)

| Gap | Milestone |
|-----|-----------|
| Mastra Harness runtime integration | M9 |
| LibSQL persistence | M9 |
| `/sandbox` preview route | M9 |
| Composition mutation functions | M9 (see LLD-02) |
| Timeline / asset library UI | M10 |
| Auth (Clerk) | M11 |
| PgStore migration | M11 |

---

*Last updated: M8 scaffold completion.*
