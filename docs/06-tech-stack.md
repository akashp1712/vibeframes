# Tech Stack

> **TL;DR** — Next.js 15 (App Router), Mastra + AI SDK + OpenAI `o4-mini`, LibSQL for Mastra storage (flag-swap to PgStore), Neon Postgres + Prisma for app data (deferred to M11), Clerk for auth (deferred to M11), Vercel for hosting, Vercel Blob for assets, shadcn/ui + Tailwind + Lucide for UI. This doc anchors every technology choice with a one-paragraph rationale, the alternative we rejected, and what we're learning by using it.

---

## 0. The stack at a glance

```
  VIBEFRAMES TECH STACK
  ═════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         VERCEL (hosting)                                │
  │                                                                        │
  │  ┌──────────────────────────────────────────────────────────────────┐   │
  │  │                    NEXT.JS 15 (App Router)                       │   │
  │  │                                                                  │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │   │
  │  │  │  React 19    │  │ Route        │  │ Server Components      │ │   │
  │  │  │  (client)    │  │ Handlers     │  │ + Server Actions       │ │   │
  │  │  │              │  │ (API)        │  │ (data fetching)        │ │   │
  │  │  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │   │
  │  │         │                 │                                      │   │
  │  │         │     ┌───────────┘                                      │   │
  │  │         │     │                                                  │   │
  │  │         ▼     ▼                                                  │   │
  │  │  ┌──────────────────────────────────────────────────────────┐    │   │
  │  │  │                    MASTRA + AI SDK                        │    │   │
  │  │  │                                                          │    │   │
  │  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │   │
  │  │  │  │ Harness  │  │  Agent   │  │  Tools   │  │  Memory │ │    │   │
  │  │  │  │ (state,  │  │ (modes,  │  │  (Zod    │  │  (hist, │ │    │   │
  │  │  │  │  modes,  │  │  instrs, │  │  in/out) │  │   OM)   │ │    │   │
  │  │  │  │  skills) │  │  model)  │  │          │  │         │ │    │   │
  │  │  │  └──────────┘  └────┬─────┘  └──────────┘  └─────────┘ │    │   │
  │  │  │                     │                                    │    │   │
  │  │  │                     ▼                                    │    │   │
  │  │  │              ┌──────────────┐                            │    │   │
  │  │  │              │ @ai-sdk/     │                            │    │   │
  │  │  │              │   openai     │                            │    │   │
  │  │  │              │  (o4-mini)   │                            │    │   │
  │  │  │              └──────┬───────┘                            │    │   │
  │  │  └─────────────────────┼────────────────────────────────────┘    │   │
  │  │                        │                                        │   │
  │  └────────────────────────┼────────────────────────────────────────┘   │
  │                           │                                            │
  │                           ▼                                            │
  │  ┌──────────────────────────────────────────────────────────────────┐   │
  │  │                      EXTERNAL SERVICES                           │   │
  │  │                                                                  │   │
  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │   │
  │  │  │  OpenAI  │  │  Neon    │  │  Clerk   │  │  Vercel Blob   │  │   │
  │  │  │  API     │  │ Postgres │  │  (auth)  │  │  (assets)      │  │   │
  │  │  │          │  │ + Prisma │  │          │  │                │  │   │
  │  │  │  MVP     │  │  M11     │  │  M11     │  │  M10e          │  │   │
  │  │  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │   │
  │  │                                                                  │   │
  │  │  ┌──────────────────────────────────────────────────────────┐   │   │
  │  │  │  LibSQLStore (Mastra storage — local .db file)            │   │   │
  │  │  │  flag-swap to PgStore when Neon lands in M11              │   │   │
  │  │  └──────────────────────────────────────────────────────────┘   │   │
  │  └──────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          CLIENT-SIDE                                    │
  │                                                                        │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
  │  │ shadcn/  │  │ Tailwind │  │  Lucide  │  │ HyperFr  │  │ Kibo UI │ │
  │  │   ui     │  │  CSS v4  │  │  icons   │  │  Player  │  │  (chat) │ │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Next.js 15 — App Router

**What**: Full-stack React framework with file-system routing, React Server Components (RSC), route handlers, server actions, and built-in optimizations.

**Why**: The App Router is the default in Next.js 15 and aligns with React 19's server component model. Route handlers give us first-class SSE support (`new ReadableStream` + `Response`). Server actions handle mutations. RSC handles data fetching without client-side state libraries. Mastra's Next.js integration is built for App Router.

**Alternative rejected**: Remix — strong conventions but smaller ecosystem for AI tooling. Mastra's first-class integration targets Next.js.

**What we're learning**: How App Router's streaming + RSC model plays with long-running SSE connections from a Mastra Harness.

**Key constraints**:
- Route handlers for `/api/chat` (SSE stream)
- Server actions for project CRUD, composition saves
- Client components only for interactive surfaces (chat, timeline, preview)
- Middleware for auth gating (Clerk, M11)

---

## 2. Mastra + AI SDK

**What**: Mastra is the orchestration framework (`@mastra/core`, `@mastra/memory`, `@mastra/libsql`). The AI SDK (`ai`, `@ai-sdk/openai`) provides the model-calling layer underneath. Mastra wraps AI SDK to add agents, tools, harnesses, modes, and memory.

**Why**: Mastra's Harness class (covered in M3) is the reason VibeFrames exists — it solves multi-turn stateful agent sessions with typed state, dynamic instructions, skills, and event streaming. No other framework offers this combination without heavy custom wiring.

**Alternative rejected**: LangChain.js — mature ecosystem, but its agent loop is lower-level; you'd rebuild Harness manually. CrewAI — Python-only. AutoGen — too heavyweight for a focused single-agent product.

**What we're learning**: Harness patterns at scale — mode switching, skill loading, memory pressure, tool composition.

**Packages**:

| Package | Purpose | When |
|---|---|---|
| `@mastra/core` | Agent, Tool, Harness, InMemoryStore | MVP (M9) |
| `@mastra/memory` | Memory class (lastMessages, OM) | MVP (M9) |
| `@mastra/libsql` | LibSQLStore (file-based SQLite) | MVP (M9) |
| `@mastra/pg` | PgStore (Postgres) | M11 (flag-swap) |
| `ai` | AI SDK core (`streamText`, `generateText`) | MVP (M9) |
| `@ai-sdk/openai` | OpenAI provider (o4-mini, gpt-5.1) | MVP (M9) |

---

## 3. OpenAI — model selection

**What**: `o4-mini` as the default model for both Plan and Vibe modes, at different reasoning efforts. Environment-variable swap to `gpt-5.1` for higher quality when needed.

**Why**: `o4-mini` is fast, cheap, and has strong reasoning with explicit `reasoningEffort` control (via `providerOptions`). For a composition agent that calls 3–8 tools per turn, speed matters more than raw quality. The two-mode architecture (M4) uses reasoning effort as the differentiator: `low` for plan mode (fast intent classification), `medium` for vibe mode (thorough composition work).

**Alternative rejected**: `gpt-5.1` as default — better quality, but 5–10x more expensive per turn and slower. We keep it as an env-swap option for demos. Anthropic Claude — strong reasoning, but Mastra's AI SDK integration with OpenAI is more mature for tool calling and structured output.

**What we're learning**: How `reasoningEffort` affects tool-calling quality and whether `low` is sufficient for plan-mode routing.

```
  MODEL STRATEGY
  ══════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  Environment variable: VIBEFRAMES_MODEL                     │
  │                                                             │
  │  ┌───────────────┐          ┌───────────────┐               │
  │  │ DEFAULT       │          │ OVERRIDE       │               │
  │  │               │          │               │               │
  │  │ o4-mini       │          │ gpt-5.1       │               │
  │  │               │          │ (env swap)    │               │
  │  └───────┬───────┘          └───────┬───────┘               │
  │          │                          │                       │
  │          ▼                          ▼                       │
  │  ┌─────────────┐           ┌─────────────┐                 │
  │  │ Plan mode   │           │ Plan mode   │                 │
  │  │ effort:low  │           │ effort:low  │                 │
  │  └─────────────┘           └─────────────┘                 │
  │  ┌─────────────┐           ┌─────────────┐                 │
  │  │ Vibe mode   │           │ Vibe mode   │                 │
  │  │ effort:med  │           │ effort:med  │                 │
  │  └─────────────┘           └─────────────┘                 │
  │                                                             │
  │  How reasoning effort maps via AI SDK:                      │
  │                                                             │
  │  const agent = new Agent({                                  │
  │    model: openai('o4-mini', {                               │
  │      reasoningEffort: 'low',    // plan mode                │
  │      reasoningSummary: 'auto',  // for SSE agent.thinking   │
  │    }),                                                      │
  │  });                                                        │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

**Decision recorded**: ADR-002 — LLM provider and reasoning strategy.

---

## 4. Storage strategy — LibSQL → PgStore

**What**: Two storage layers, serving different purposes:

```
  STORAGE LAYERS
  ══════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  LAYER 1: MASTRA STORAGE (agent state)                              │
  │  ─────────────────────────────────────                              │
  │  What:   threads, messages, OM records, thread metadata             │
  │  MVP:    LibSQLStore → file:local.db (survives dev restarts)        │
  │  Prod:   PgStore → Neon Postgres (flag-swap in M11)                 │
  │  Config: MASTRA_STORAGE=libsql|pg (env var)                         │
  │                                                                     │
  │  ┌──────────────────┐         ┌──────────────────┐                  │
  │  │  MVP (M9)        │   ───►  │  Prod (M11)      │                  │
  │  │                  │  flag   │                  │                  │
  │  │  LibSQLStore     │  swap   │  PgStore         │                  │
  │  │  file:local.db   │         │  Neon Postgres   │                  │
  │  │                  │         │                  │                  │
  │  │  ✓ zero config   │         │  ✓ durable       │                  │
  │  │  ✓ works offline │         │  ✓ multi-pod     │                  │
  │  │  ✓ survives      │         │  ✓ serverless    │                  │
  │  │    restart       │         │    friendly      │                  │
  │  └──────────────────┘         └──────────────────┘                  │
  │                                                                     │
  │                                                                     │
  │  LAYER 2: APP DATABASE (business data)                              │
  │  ─────────────────────────────────────                              │
  │  What:   users, workspaces, projects, compositions, assets          │
  │  When:   M11 (deferred — no premature schema)                       │
  │  Stack:  Neon Postgres + Prisma ORM                                 │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────┐       │
  │  │  Prisma schema (M11):                                    │       │
  │  │                                                          │       │
  │  │  User ←──► Workspace (many-to-many via Membership)      │       │
  │  │  Workspace ──► Project[]                                │       │
  │  │  Project ──► Composition[]                              │       │
  │  │  Project ──► Asset[]                                    │       │
  │  └──────────────────────────────────────────────────────────┘       │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

**Why two layers**: Mastra storage handles agent-internal state (threads, messages, OM). App data (projects, compositions, users) needs its own schema with proper relations, migrations, and query patterns. Mixing them would couple agent internals to business logic.

**Why LibSQL first**: Zero-config, works offline, file-based. Perfect for local dev where you want the Harness to survive `next dev` restarts without setting up a database. The `@mastra/libsql` package is a drop-in.

**Why PgStore later**: Neon Postgres is serverless, branches for preview environments, and scales to production. When Neon lands in M11, we flag-swap `MASTRA_STORAGE=pg` and point it at the same Neon instance as the app database (different schema namespace).

**Decision recorded**: ADR-003 — Storage strategy (LibSQL → PgStore).

---

## 5. Vercel — hosting

**What**: Vercel for deployment. Serverless functions (Node.js runtime) for API routes, Edge runtime optional for middleware, static assets on CDN.

**Why**: First-class Next.js deployment. Zero-config builds. Preview deployments per PR. Built-in analytics. The SSE route handler works on Vercel's Node runtime with up to 5 minutes execution time (Pro plan) — sufficient for agent turns.

**Alternative rejected**: Self-hosted (Docker + Fly.io) — more control over long-running connections, but significantly more ops overhead. Railway — strong DX but smaller ecosystem. We accept Vercel's timeout constraints and optimize agent turns to complete within limits.

**Key constraints**:
- **Hobby plan**: 30s function timeout — tight for multi-tool agent turns
- **Pro plan**: 300s function timeout — comfortable for all but the longest sessions
- **Edge runtime**: not used for SSE routes (needs Node APIs), but fine for middleware
- **Cold starts**: first request per function instance adds ~200–500ms; Harness creation adds another ~60–200ms on top

```
  VERCEL DEPLOYMENT
  ═════════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  Static assets (HTML, CSS, JS)                              │
  │  └──► CDN (global, cached)                                  │
  │                                                             │
  │  Server Components                                          │
  │  └──► Serverless Function (Node 22)                         │
  │                                                             │
  │  /api/chat (SSE route)                                      │
  │  └──► Serverless Function (Node 22)                         │
  │       └── Timeout: 30s (Hobby) / 300s (Pro)                 │
  │       └── No WebSocket support (serverless)                 │
  │       └── SSE streaming works via ReadableStream            │
  │                                                             │
  │  Middleware (auth check)                                     │
  │  └──► Edge Runtime (~0ms cold start)                        │
  │                                                             │
  │  Preview deploys: one per git push (great for testing)      │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

---

## 6. Neon Postgres + Prisma — app data (M11)

**What**: Neon for serverless Postgres hosting. Prisma as the TypeScript ORM with migrations, type-safe queries, and schema-as-code.

**Why**: Neon's serverless driver (`@neondatabase/serverless`) works in Vercel's serverless functions without connection pooling issues. Prisma generates TypeScript types from the schema — eliminates runtime type mismatches. Database branching gives us preview environments for free.

**Alternative rejected**: Supabase — strong all-in-one, but we only need Postgres + auth (Clerk handles auth). PlanetScale — MySQL, not Postgres. Drizzle ORM — lighter, but Prisma's migration story is more mature.

**When**: Deferred to M11. Until then, app data (projects, compositions) lives in-memory or on disk. No premature schema design.

**What we're learning**: Whether Neon's serverless driver introduces latency on cold starts and how Prisma's generated client performs in serverless.

---

## 7. Clerk — auth & organizations (M11)

**What**: Clerk for authentication, user management, and organization/workspace multi-tenancy.

**Why**: Drop-in React components (`<SignIn>`, `<UserButton>`, `<OrganizationSwitcher>`). Next.js middleware integration for route protection. Organizations feature maps directly to workspaces. Eliminates auth plumbing — no password hashing, session management, or OAuth flows to build.

**Alternative rejected**: NextAuth.js (Auth.js) — lower cost, but organizations/workspaces require significant custom code. Supabase Auth — tied to Supabase ecosystem.

**When**: Deferred to M11. The core Harness loop (M9) runs without auth. Clerk layers on top without restructuring.

---

## 8. Vercel Blob — asset storage (M10e)

**What**: Vercel Blob for user-uploaded assets (images, audio files, video clips).

**Why**: Works natively on Vercel with zero infra. Simple API: `put(filename, body)` → returns a URL. No S3 bucket configuration or IAM policies.

**Alternative rejected**: AWS S3 — more control but more ops. Cloudflare R2 — cheaper egress, but another vendor to manage. UploadThing — nice DX but adds a dependency.

**When**: M10e (asset library). Until then, assets are blob URLs in memory.

---

## 9. HyperFrames — video engine

**What**: HeyGen's HTML-native video creation framework. Compositions are HTML documents with data attributes. The `<hyperframes-player>` web component handles browser preview; the `hyperframes render` CLI produces MP4.

**Why**: Agent-native by design — LLMs generate HTML, not proprietary formats. Deterministic rendering (same HTML = same video). No FFmpeg dependency for preview. Covered in depth in M1.

**Packages**:

| Package | Purpose | When |
|---|---|---|
| `@anthropic-ai/hyperframes-player` | Browser preview web component | MVP (M8) |
| `@anthropic-ai/hyperframes-core` | Composition types, validation | MVP (M8) |
| `hyperframes` (CLI) | MP4 render (server-side) | Post-launch |

---

## 10. UI stack

**What**: shadcn/ui for components, Tailwind CSS v4 for styling, Lucide for icons, Kibo UI for chat-specific components, MagicUI / Aceternity for accents.

```
  UI COMPONENT SOURCES
  ════════════════════

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  BASE LAYER                                                      │
  │  ──────────                                                      │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
  │  │  Tailwind v4  │  │  Lucide      │  │  shadcn/ui   │           │
  │  │  (utility     │  │  (icons)     │  │  (Button,    │           │
  │  │   classes)    │  │              │  │   Dialog,    │           │
  │  │              │  │              │  │   Input,     │           │
  │  │              │  │              │  │   Tabs...)   │           │
  │  └──────────────┘  └──────────────┘  └──────────────┘           │
  │                                                                  │
  │  DOMAIN LAYER                                                    │
  │  ────────────                                                    │
  │  ┌──────────────────────────────────────────────────────────┐    │
  │  │  Kibo UI (chat components)                                │    │
  │  │                                                           │    │
  │  │  Message · Reasoning · ToolCall · Suggestion · ChatInput │    │
  │  └──────────────────────────────────────────────────────────┘    │
  │                                                                  │
  │  ACCENT LAYER (sparingly)                                        │
  │  ────────────                                                    │
  │  ┌──────────────────┐  ┌────────────────┐                       │
  │  │  MagicUI          │  │  Aceternity    │                       │
  │  │  AnimatedGradient │  │  Spotlight     │                       │
  │  │  Marquee          │  │  (landing)     │                       │
  │  └──────────────────┘  └────────────────┘                       │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

**Why shadcn/ui**: Copy-paste model — components live in your codebase, not `node_modules`. Full customization without fighting library opinions. Built on Radix primitives (accessible by default).

**Why Kibo UI for chat**: Purpose-built chat components that handle streaming text, reasoning collapsibles, and tool-call cards — the exact UX patterns we need for the Harness event stream.

**Detail deferred to M7** (UI System doc): branding, palette, typography, wireframes.

---

## 11. Package manager and tooling

| Tool | Choice | Why |
|---|---|---|
| **Package manager** | `pnpm` | Fast, disk-efficient, strict `node_modules` |
| **Runtime** | Node 22+ | Required by Mastra |
| **Linting** | ESLint 9 (flat config) | Next.js default |
| **Formatting** | Prettier | Consistent code style |
| **Testing** | Vitest | Fast, ESM-native, works with TypeScript |
| **Type checking** | TypeScript 5.5+ | Strict mode |

No monorepo (Turborepo, Nx) for MVP — single Next.js app at repo root. If we later extract packages (e.g., composition model as a library), we add workspaces then.

---

## 12. Environment variables

```
  ENV VARS (by module)
  ════════════════════

  MVP (M9):
  ┌──────────────────────────────────────────────┐
  │ OPENAI_API_KEY          ← OpenAI API access  │
  │ VIBEFRAMES_MODEL        ← o4-mini (default)  │
  │ MASTRA_STORAGE          ← libsql (default)   │
  └──────────────────────────────────────────────┘

  M11 (persistence + auth):
  ┌──────────────────────────────────────────────┐
  │ DATABASE_URL            ← Neon Postgres URL  │
  │ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY            │
  │ CLERK_SECRET_KEY                             │
  │ BLOB_READ_WRITE_TOKEN  ← Vercel Blob access │
  └──────────────────────────────────────────────┘
```

---

## 13. Dependency timeline

```
  MODULE   PACKAGES ADDED
  ══════   ═══════════════

  M8       next, react, react-dom
  (scaffold) tailwindcss, @tailwindcss/postcss
           shadcn/ui init (components copied in)
           lucide-react
           @hyperframes/player, @hyperframes/core

  M9       @mastra/core, @mastra/memory, @mastra/libsql
  (harness)  ai, @ai-sdk/openai
           zod (Mastra peer dep)

  M10      kibo-ui (chat components)
  (editor)   @xzdarcy/react-timeline-editor (or custom — ADR-005)
           magic-ui, aceternity-ui (sparingly)

  M11      @prisma/client, prisma (dev)
  (persist)  @neondatabase/serverless
           @clerk/nextjs

  M12      (no new deps — polish only)
  (deploy)
```

**Target**: < 20 direct dependencies for MVP (M9). Each addition justified by a doc reference.

---

## 14. What's next

- **ADR-002** — LLM provider and reasoning strategy (recorded alongside this doc)
- **ADR-003** — Storage strategy: LibSQL → PgStore (recorded alongside this doc)
- **M7** — UI System: branding, palette, typography, component picks, wireframes
