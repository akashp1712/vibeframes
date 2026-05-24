# ADR-003 — Storage strategy (LibSQL → PgStore)

**Status**: Accepted  
**Date**: 2025-05-24  
**Deciders**: Project author  

## Context

VibeFrames has two distinct storage needs:

1. **Mastra storage** — threads, messages, observational memory records, thread metadata. Managed by the Harness and Memory subsystem.
2. **App data** — users, workspaces, projects, compositions, assets. Business domain, relational, needs migrations.

We need to choose a Mastra storage backend that works for local dev (M9) and can be swapped to production (M11) without restructuring.

## Options considered

1. **InMemoryStore** — zero config, but lost on every restart. Unusable for any real development.
2. **LibSQLStore** — file-based SQLite (`file:local.db`). Survives restarts, zero external dependency.
3. **PgStore** — Postgres-backed. Durable, multi-pod compatible, serverless-friendly with Neon.
4. **Start with PgStore from day one** — skip LibSQL, require Neon even for local dev.

## Decision

**LibSQLStore for MVP (M9)**, with a **flag-swap to PgStore in M11** when Neon Postgres is added.

```
MASTRA_STORAGE=libsql   →  LibSQLStore({ url: 'file:local.db' })
MASTRA_STORAGE=pg       →  PgStore({ connectionString: DATABASE_URL })
```

App data uses **Neon Postgres + Prisma** (M11, separate from Mastra storage).

## Rationale

- **LibSQL first**: zero config, works offline, file-based. `pnpm dev` → agent loop works → conversation persists across restarts. No database setup ceremony for M9.
- **Flag-swap, not rewrite**: `@mastra/libsql` and `@mastra/pg` implement the same `MastraStorage` interface. Swapping is one line in the Harness factory.
- **Two layers, not one**: Mastra storage (agent internals) and app data (business domain) serve different purposes. Mixing them couples agent internals to business schema — bad for both.
- **Neon deferred**: No premature schema design. The core Harness loop (M9) proves the agent works before we add persistence complexity.

## Tradeoffs

- **LibSQL is single-process** — no multi-pod support. Fine for local dev, but Vercel serverless functions are multi-instance. Production requires PgStore.
- **Two databases in production** — Neon serves both Mastra PgStore and Prisma app data. Same Postgres instance, different schema namespaces. Slight operational complexity, but clear separation of concerns.
- **Migration gap** — LibSQL → PgStore swap doesn't migrate existing threads/messages. Acceptable: M9 is local dev, and we start fresh in production.

## Consequences

- M9 ships with `@mastra/libsql` and `file:local.db` — developers can run the full agent loop with no external dependencies
- M11 adds `@mastra/pg`, `@prisma/client`, and `@neondatabase/serverless`
- Storage backend is selected via `MASTRA_STORAGE` env var in the Harness factory
- Thread/message history from local dev does not migrate to production (clean slate)
- App data schema (Prisma) is designed in M11, not before
