---
status: review
owner: claude
depends_on: []
updated: 2026-11-08
---

# Route guards

## Goal

The proxy of `@nano-app/frontend` guards the app's pages from the config of the store with Better Auth: no component per page.

## Scope

- `auth` of an `api` store is `{ path, routes? }`: `path` is the `basePath` of Better Auth, `routes` the guarded pages. Breaking: `auth` was a string.
- Every page is public unless a route of `auth.routes` matches it. The first route that matches wins, across the stores with `auth`.
- A route: `match` (exact, or `/x/*` for it and below), `redirect` (`/` by default), `roles` (`'admin,editor'`, any of them), `permissions` (`{ collections: 'read,update' }`, all of them). Without `roles` nor `permissions` it needs a session.
- Session and roles: `GET <path>/get-session`. Permissions: `POST <path>/admin/has-permission`. Both through the store's backend, with the browser's cookie and the app's origin.
- The routes are read once, when the proxy loads.
- The `Validator` warns about and skips a store with invalid routes, as with any invalid store file, also a route whose `match` covers its own `redirect`.
- A 401 of an auth store refreshes the page with Next's router, so the proxy guards it again.
- Out of scope: the organization plugin, checking role and action names against the backend.

## Log

- 2026-11-08 · claude · Implemented on `feat/route-guards`: `core` (`Paths.matches`, `DEFAULT_REDIRECT`, `Validator` of `auth`), `frontend` (`guard.ts`, `forward.ts`, refresh on 401), tests and README. Invalid routes warn and skip the store (CLAUDE.md), not stop the build as first planned.
