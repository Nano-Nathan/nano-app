---
status: todo
owner: null
depends_on: []
updated: 2026-11-10
---

# Drizzle instead of Prisma

Taken before 1.0.0: no app runs on nano-app yet, so the database layer can change its contract once.

## Goal

The backend, the official plugins and `crud` run on Drizzle ORM. The schema of an app and of each plugin is TypeScript, there is no client to generate, and the official plugins get their tables without migration files.

## Analysis

What exists today (all Prisma 7):

- `backend/src/database/Database.ts`: mounts one client per plugin from a `.prisma` file (`database.schemaPath`), checks that every model can be read, and enforces the `nano_*` rule (official plugins only `nano_*` schemas, the others none).
- `backend/src/database/Prisma.ts`: generates each client into `.nano-app/prisma-clients/<name>` when the schema hash changes, and applies the `migrations/` an official plugin ships (`prisma migrate deploy` with a temporary `prisma.config.mjs`).
- `core`: `FileLoader.findPrismaClient`, `FileReader.loadSchema`/`datasource`/`schemas` (schema parsed as text), `Validator.isPrisma` (provider and `nano_*`).
- `backend/src/auth/BetterAuth.ts`: `prismaAdapter`, and the check that the app's schema has Better Auth's models.
- `backend/src/app/errors.ts`: Prisma error codes (`P2025`, `P2002`, `P2003`, validation) to HTTP statuses.
- `plugins/crud`: `Query.toPrisma` maps `QueryParams` to Prisma (`where`, `include`, `select`, `orderBy`, `take`, `skip`); writes accept Prisma's nested writes.
- No official plugin ships tables yet: the migration path exists for the planned ones (scheduler, mail).
- Tests: `.prisma` fixtures under `backend/tests/fixtures` and the crud suites; CI runs `prisma db push` on a Neon branch.
- Consumers: `finance` (Prisma schema with Better Auth's models, `prisma migrate dev`).

What Drizzle gives, checked in its docs and packages (2026-11-10):

- `drizzle-orm` `1.0.0-rc.5` (`latest` is `0.45.4`): relational queries v2 with object `where`, relation filters and `with`; public metadata (`getTableConfig`, `getColumns`, the relations object). No nested writes: several tables are written in a transaction.
- `drizzle-kit` `1.0.0-rc.5`: `push` applies the diff between a TypeScript schema and the database; `drizzle-kit/api` exports `pushSchema(schema, db, schemaFilters)` returning `{ hasDataLoss, warnings, statementsToExecute, apply }`, with no prompts.
- `@better-auth/drizzle-adapter` 1.7.18: peer `drizzle-orm ^0.45.2 || >=1.0.0-rc.1`.

What is reused: the plugin and route model, `Database` as the registry of clients by name, the `nano_*` rule, the error handler, the crud permissions per method.

## Scope

- The app declares its schema in TypeScript (tables and relations) and nano-app creates its Drizzle client on `DATABASE_URL`; no generation step.
- The `nano_*` rule and the readiness check (every table readable) read the schema objects, not text.
- Official plugins declare their tables in their own `nano_*` schema; at startup nano-app pushes only that schema, applies it when the diff loses no data, and stops with the statements otherwise. A Postgres advisory lock serializes replicas.
- Better Auth runs on the Drizzle adapter; the app's schema includes its tables (`npx auth generate`).
- The error handler maps Postgres errors (`23505`, `23503`, …) instead of Prisma's.
- `crud` maps `QueryParams` to relational queries v2 and checks the permission of every related model a request reaches, from Drizzle's public relations metadata.
- READMEs, CLAUDE.md, tests and fixtures follow; `finance` moves to Drizzle as the first consumer.

Out of scope: other databases than PostgreSQL; a migration command of nano-app for the app's schema (the consumer migrates it with `drizzle-kit`, as today with Prisma).

## Done when

An app with Better Auth, `crud` and an official plugin with tables starts on Drizzle with no generated client and no migration file of the plugin, every suite passes on the Neon branch, and `finance` runs on it.

## Modules

| # | Task | Does | Done when | Depends on |
|---|---|---|---|---|
| 1 | Spike | Checks on a throwaway project the three pieces the plan rests on: `drizzle-orm`/`drizzle-kit` rc with relational queries v2, `pushSchema` of `drizzle-kit/api` filtered to one schema (data-loss report included), and Better Auth's Drizzle adapter on the rc | A short report in the log: works, breaks, or needs a workaround, per piece | — |
| 2 | Database layer | `Database` mounts Drizzle clients from the app's TS schema; `Prisma.ts`, `findPrismaClient`, the schema text parsing and `Validator.isPrisma` go; the `nano_*` rule and readiness checks read the schema objects; Postgres error codes in the handler | The backend suites pass on Drizzle with TS fixtures | 1 |
| 3 | Plugin tables by push | An official plugin's schema is pushed at mount (advisory lock, no data loss, else stop); CLAUDE.md's DDL rule changes from "official plugins' migrations" to "official plugins' push of their `nano_*` schema" | A plugin fixture gets its tables on an empty database, a second start changes nothing, and a lossy change stops the startup | 2 |
| 4 | Better Auth | `drizzleAdapter` and the models check on the Drizzle schema | The Better Auth suite passes | 2 |
| 5 | crud | `QueryParams` to relational queries v2; permissions of related models from the relations metadata; no nested writes | The crud suites pass, with related-model permissions covered | 2 |
| 6 | Docs and finance | READMEs, CLAUDE.md, the `features/` files that mention Prisma; `finance` on Drizzle with `drizzle-kit` migrations | `finance` builds and runs its guarded pages and crud on Drizzle | 3, 4, 5 |

## Decisions

First round, decided 2026-11-10: 1A, 2A, 3A.

1. Drizzle version.
   - **A (recommended)**: `1.0.0-rc`. Relational queries v2 (object `where`, relation filters) and the Better Auth adapter support it; nano-app reaches 1.0 on Drizzle 1.0.
   - B: `0.45` stable. Older relational API without relation filters; a second migration when Drizzle 1.0 ships.
2. Where the app's schema lives.
   - **A (recommended)**: `mainPlugin.database.schemaPath` points to a TS module (`src/db/schema.ts`) that exports its tables and relations, loaded with `jiti` as today's routes. Same shape as the current config.
   - B: a fixed file by convention (`src/db/schema.ts`), no config.
3. Shape of `QueryParams.filter` in `crud`.
   - **A (recommended)**: Drizzle's relational `where` as is (`{ title: { like: 'a%' } }`), passed through. Least code; changes the filter operators the frontend sends (no consumer depends on them yet).
   - B: keep today's Prisma-like operators (`startsWith`, `contains`, …) and translate them. No change for the frontend; a translation layer to maintain.

Later rounds: whether `drizzle-kit` is an optional peer (as `prisma` today) or a dependency of the backend; the readiness check (a `select … limit 1` per table, or Postgres' catalog); how `crud` hides columns nobody should read.

## Risks

- `drizzle-kit/api` is exported but barely documented: it may change between versions. The spike pins what it returns, and a test covers it.
- Push only applies additive changes safely: renaming a column of an official plugin needs a release that handles it by hand.
- `drizzle-kit` at runtime is a large dependency for the backend's image.
- 1.0 is a release candidate: a breaking change before 1.0.0 is possible.

## Log

- 2026-11-10 · claude · Plan written from the analysis above (Prisma inventory, Drizzle rc docs, Better Auth adapter peers). Waiting for the first round of decisions; module 1 starts after them.
- 2026-11-10 · claude · Decisions 1A (`drizzle-orm`/`drizzle-kit` 1.0 rc), 2A (`mainPlugin.database.schemaPath` to a TS module), 3A (`crud` passes Drizzle's relational `where` through).
