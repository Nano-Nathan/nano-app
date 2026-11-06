---
status: done
owner: kleo
depends_on: []
updated: 2026-11-06
---

# Access

## Goal

A route knows what the session's user may do, so an app allows a model and an action by role (what personal-app does with `ENTITY_MIN_ROLE` and `rolId`), and [automatic-crud](automatic-crud.md) publishes its models through it.

## Scope

- Today Better Auth's guard is one global `app.use` (`backend/src/routes/Plugin.ts`): every route mounted after it needs a session and receives `session` in its params. There are no roles and no permission per route.
- Evaluate Better Auth's `admin` and `access` plugins (in `better-auth` ^1.7.12): resources and actions per role, for example `Collections: ['read', 'create']`.
- A route asks for a permission (for example `can('Collections', 'create')`) and answers 403 without it.
- Which routes stay public, and how they are declared.

## To decide with the maintainer

1. Roles from Better Auth's `admin` / `access` plugins, or a field of the app's user.
2. How a route declares the permission it needs.
3. How public routes are declared.

## Out of scope

Migrating personal-app's users and bcrypt hashes to Better Auth.

## Done when

In the test app, a user without the role gets 403 on a route that asks for it, and a user with the role passes.

## Log

- 2026-10-29 · kleo · Created from automatic-crud, whose `exposure` module depends on it.
- 2026-10-30 · kleo · Taken. Analysis and task tree proposed to the maintainer.
- 2026-10-30 · kleo · Maintainer: start with public routes. Decided: a flag on the route, `createRoute({ public: true, ... })` for the whole route (not per method); the guard moves from the global `app.use` to each endpoint. Better Auth installation may change.
- 2026-10-30 · kleo · Better Auth stays in core (`packages.betterAuth`), not an official plugin: its models live in the app schema and the guard belongs to `Endpoint`. Task `public` decided: middlewares added in `onMount` stay outside the guard (documented); an unknown URL answers 404; routes of plugins mounted after the app need a session unless `public: true`; a public route still receives `session` when there is one.
- 2026-10-30 · kleo · Task `public` moved to [automatic-crud](automatic-crud.md) as its module `public`.
- 2026-11-05 · kleo · Maintainer: roles and permissions are those of Better Auth's admin plugin; one module. `createRoute({ permissions })` answers 403 without them (`userHasPermission`); a public route does not check them; without Better Auth the route answers, with a warning at startup. Every plugin mounted with the app or after it receives Better Auth's instance as `auth` (`BetterAuth.get()`), and its params are frozen.
