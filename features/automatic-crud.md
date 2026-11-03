---
status: in-progress
owner: kleo
depends_on: []
updated: 2026-10-29
---

# Automatic CRUD

## Goal

Every exposed model of the consumer's `schema.prisma` becomes REST with queries, without writing a route. It is the 1.0 milestone.

## Scope

An official plugin: one route file (`routes/index.route.ts`, expression `/:model{/:id}`) plus a query translator. Base to reuse: personal-app's `backend/src/endpoints/Entities.ts` (generic CRUD) and `OData` in `backend/src/lib/Mapping.ts` (nested `orderby`).

| Request | Prisma |
|---|---|
| `QUERY /api/users`, body `QueryParams` | `findMany` plus `count` |
| `QUERY /api/users/7`, body `QueryParams` | `findUnique` with `select` / `include` |
| `GET /api/users`, `GET /api/users/7` | the same, without parameters |
| `POST /api/users` | `create` |
| `PUT /api/users/7` | `update`: only the fields sent |
| `DELETE /api/users/7` | `delete` |

- `QUERY` is the way to read with parameters, for a list and for one record: it is what the frontend store `api` already sends.
- `PUT`, not `PATCH`: the store's `update` already sends `PUT` and CORS allows it.
- The model list comes from the generated client's `ModelName` (public API), not from the DMMF or from parsing `schema.prisma`.
- Filters are JSON only (core's `QueryParams`), with Prisma's operators as they are: `{ "price": { "gte": 1000 } }`.
- A list answer carries the total, so a table can paginate: `{ "success": true, "result": [ … ], "count": 128 }`.
- Errors: `P2025` → 404, `P2002` and `P2003` → 409, validation → 400; anything else falls to the core error handler as 500. The raw Prisma message is never sent: it carries table and column names.
- An unknown model answers 404 before touching the database. Private by default, like every route.
- Earlier implementation of the query builder, as reference: `git show 350114a:backend/src/odata/QueryBuilder.ts` in `nano-app.dev`.

## Modules

Split by the maintainer (2026-10-29): branch `feat/automatic-crud`, one branch and pull request per module (see `.claude/CLAUDE.md`).

1. `query`: `QueryParams` → Prisma arguments: `filter` → `where`, `orderby` → `orderBy` (dot notation for nested fields), `top`/`skip` → `take`/`skip`, `select` → `select`. A pure function, unit tests without a database. Depends on: —.
2. `expand`: `expand` in core's `QueryParams`, translated to `include`. Depends on: `query`.
3. `read`: the route with `QUERY` and `GET`, the list with its `count`, unknown models → 404. Depends on: `query`.
4. `write`: `POST`, `PUT`, `DELETE`. Depends on: `read`.
5. `errors`: Prisma errors to 404 / 409 / 400. Depends on: `read`.
6. `override`: a consumer route wins over the generic one (personal-app's `POST Collections`). Depends on: `read`.
7. `public`: `createRoute({ public: true })` answers without a session. The Better Auth guard moves from the global `app.use` to each endpoint: routes of plugins mounted after the app need a session unless `public`, an unknown URL answers 404, a public route still receives `session` when there is one, middlewares added in `onMount` stay outside the guard. Depends on: —. Decided in [access](access.md).
8. `exposure`: which models and actions are published, and for whom, through [access](access.md). Depends on: `read`, access.
9. `e2e`: the "Done when" below. Depends on: every module.

## To decide with the maintainer

1. Ceilings for `expand` depth and `top` (otherwise a denial-of-service vector).

## Out of scope

`PATCH` (`PUT` covers it). Soft delete (personal-app does not use it). Business logic: anything that is not CRUD is a consumer `*.route.ts`. A second database provider (`DatabaseProvider`): when it is needed.

## Done when

In the test app, a new model of the schema is read, filtered, created, updated and deleted from the frontend without routes of its own.

## Log

- 2026-10-29 · kleo · Taken. Split into modules by the maintainer. Decided: models from `ModelName`; JSON filters with Prisma's operators; `expand` is added to `QueryParams`; `QUERY` for lists and single records; `PUT` instead of `PATCH`; exposure and permissions wait for the new [access](access.md) feature. Soft delete left out.
- 2026-10-30 · kleo · Maintainer: the `public` task of [access](access.md) becomes the module `public` of this feature (branch `feat/automatic-crud--public`).
- 2026-11-03 · kleo · Module `public` implemented on `feat/automatic-crud--public`: Better Auth only looks up the session, each `Endpoint` answers 401 without one unless the route is `public`; tests on the real database, README of `backend` updated.
