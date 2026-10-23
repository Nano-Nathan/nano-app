---
status: todo
owner: null
depends_on: [response-contract]
updated: 2026-10-23
---

# Automatic CRUD

## Goal

Every exposed model of the consumer's `schema.prisma` becomes REST with queries, without writing a route. It is the 1.0 milestone.

## Scope

- An official plugin. The model is a path parameter, so one route file plus a query builder is the whole plugin (`routes/index.route.ts`, expression `/:model{/:id}`):

  | Request | Prisma |
  |---|---|
  | `GET /api/users` | `findMany` with the query arguments |
  | `GET /api/users/7` | `findUnique` |
  | `POST /api/users` | `create` |
  | `PATCH /api/users/7` | `update` |
  | `DELETE /api/users/7` | `delete` |

- Queries in the shape of core's `QueryParams` (what the frontend store `api` sends): `filter` → `where`, `orderby` → `orderBy` (dot notation for nested fields), `top`/`skip` → `take`/`skip`, `select` → `select`, `expand` → `include`. Operators `eq`, `ne`, `ge`, `le`, `contains`, `startswith`, `endswith`, combined with `and`/`or`.
- A list answer carries the total, so a table can paginate: `{ "success": true, "result": [ … ], "count": 128 }`.
- Errors: `P2025` → 404, `P2002` and `P2003` → 409, validation → 400; anything else falls to the core error handler as 500. The raw Prisma message is never sent: it carries table and column names.
- An unknown model answers 404 before touching the database. Private by default, like every route.
- Earlier implementation of the query builder, as reference: `git show 350114a:backend/src/odata/QueryBuilder.ts` in `nano-app.dev`.

## To decide with the maintainer

1. How to read the model list: the generated client's DMMF (ties the plugin to a Prisma internal) or parsing `schema.prisma` (slower, duplicates Prisma).
2. Filter syntax: JSON only (what the store sends), or also the string form (`filter=price ge 1000`) if typed URLs are a real case.
3. Exposure: a model is published because someone listed it, not because it exists. Make `include` mandatory, or at least log every exposed model at startup.
4. Ceilings for `expand` depth and `top` (otherwise a denial-of-service vector).
5. Soft delete per model (`DELETE` writes a column).

## Out of scope

`PUT` (`PATCH` covers it). Business logic: anything that is not CRUD is a consumer `*.route.ts`. A second database provider (`DatabaseProvider`): when it is needed.

## Done when

In the test app, a new model of the schema is read, filtered, created, updated and deleted from the frontend without routes of its own.

## Log
