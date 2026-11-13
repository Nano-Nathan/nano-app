---
status: todo
owner: null
depends_on: [drizzle]
updated: 2026-11-13
---

# Prisma client

## Goal

An app or a plugin can mount its database with Prisma instead of Drizzle, through the same `DatabaseManager`: the shared pool of `DATABASE_URL`, the lock for its changes and the `nano_*` rule stay as they are.

## Analysis

- `backend/src/types/database.ts` defines `DatabaseClient`: `tables()`, `connect(oPool)`, `migrate(sFolder)` and `push()`. `backend/src/database/clients/Drizzle.ts` is its only implementation.
- `DatabaseConfig` is `DatabaseOptions` (`migrate`, `push`, common to every client) and `DrizzleConfig` (Drizzle's options and `relations`).
- `DatabaseManager.getClient` creates `new Drizzle(...)` directly: there is no way to choose the client yet.
- `Validator.checkTables` (`core`) applies the `nano_*` rule to the tables any client reports.

## Scope

- `clients/Prisma.ts` implements `DatabaseClient` on the shared pool.
- `DatabaseConfig` accepts a Prisma config next to Drizzle's, and `DatabaseManager` creates the client the config asks for.
- READMEs and tests follow.

Out of scope: other databases than PostgreSQL; Better Auth on Prisma.

## Done when

An app mounts its database with Prisma, its handlers receive the Prisma client, its migrations or its push apply at startup under the lock, and a table in another plugin's `nano_*` schema fails the startup.

## Decisions

To check in Prisma's docs before proposing them:

1. How the config says which client it uses (a key, or the shape of the config).
2. How Prisma takes the shared `pg.Pool` (driver adapter) and where the consumer's generated client comes from.
3. How `migrate` and `push` run without its CLI, and how `tables()` reads its models' schemas.

## Log

- 2026-11-13 · claude · Feature written after the database layer split into `DatabaseManager` and its clients (`DatabaseClient`, Drizzle the first).
