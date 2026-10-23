---
status: todo
owner: null
depends_on: []
updated: 2026-10-23
---

# Migrations

## Goal

An app on nano-app migrates its database with history, by hand, without `db push`.

## Why

`db push` computes the difference at that moment and can drop columns. With history every schema change is reviewable SQL, and the `_prisma_migrations` table of each database says which version it is on: with several deployments running the same image, that is how you know which one fell behind. Migrating is a decision, not a side effect of starting: the app's startup never migrates the app's schema.

## Scope

- A `migrate` command in the `@nano-app/backend` CLI (`prisma migrate deploy`), which today only has `generate` and `push`.
- It covers the app's schema and its plugins' (for example `nano_auth` of `auth`). The official plugins' migrations already exist (`migrations/` next to the schema, see `PLUGINS.md`) and are applied at startup.
- To decide with the maintainer: where the migrations of a non-official plugin live, and how several histories live in the same database (Prisma keeps one per connection schema, in `_prisma_migrations`).

## Out of scope

Writing the image contract ([image-contract](image-contract.md)).

## Done when

A test app starts without `db push`, and `pnpm migrate` applies the app's and its plugins' migrations on an empty database and on a database with earlier migrations.

## Log
