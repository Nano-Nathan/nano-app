---
status: todo
owner: null
depends_on: []
updated: 2026-11-20
---

# crud models beyond the app's tables

## Goal

The `crud` plugin answers on `/<model>` for data that is not a table of the app's Drizzle client: Better Auth's users, its API keys, or the tables of another plugin. The frontend stays agnostic: it always speaks the crud contract (`GET`, `QUERY`, `POST`, `PUT`, `DELETE` on `/<model>{/<id>}`, lists answered as `result: { values, count }`) and never knows where a model lives. Taken when the admin page has to manage users.

## Context

- Today crud reads the app's `db` and `relations` from `HandlerParams` (`db.query[model]`, `db.insert(relations[model].table)`): it cannot reach Better Auth's tables, which Better Auth reads through Kysely in its `nano_auth` schema, nor the Drizzle client of a plugin.
- Writing those tables directly skips their logic: an API key is stored hashed and its value is generated, banning or deleting a user revokes its sessions, Better Auth's `databaseHooks` run only through its API. Replicating Better Auth's tables as Drizzle tables was rejected for that reason.
- A data source in the frontend (an `EntitySource` with one implementation per backend) was rejected: the translation and part of the logic would live in the browser, once per source, and permissions would no longer live in one place.

## Scope

- `models` of crud accepts, besides the name of a table of the app's relations, a model with its own handlers (`read`, `create`, `update`, `delete`). Each handler reaches its source (Better Auth's `auth.api.*`, a plugin's client) and answers like a table: a list as `{ values, count }`, a record as the record.
- Permissions per model and action and the zod `validations` stay as they are, for both kinds of model.
- Users without passwords: an admin creates, updates and deletes users; signing in, signing up and resetting a password stay with Better Auth and the user. Verified on better-auth 1.7.21: `/admin/create-user` takes no `password`, a password reset creates the credential account when it is missing, and signing up with an email that already exists fails with `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`.
- Out of scope: translating every Drizzle `where` and `orderBy` to a source that cannot take them. Each handler supports what its source allows (`listUsers` filters and sorts by one field) and fails on the rest.

## Done when

An app passes a users model to crud, and the admin page lists, creates, updates and deletes users through `/users` with the same views as any table, with no change in the frontend.

## Log

- 2026-11-19 · claude · Written from the design of the entity maintainer (table, form and admin page), which leaves auth out for now.
- 2026-11-20 · claude · Updated to crud's models by name and lists as `{ values, count }`.
