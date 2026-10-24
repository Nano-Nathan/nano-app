---
status: todo
owner: null
depends_on: []
updated: 2026-10-24
---

# Auth in the frontend

## Goal

With Better Auth on in the backend (`packages.betterAuth`), the frontend has the session, a login and protected routes; without it, nothing.

## Scope

- Listed point by point with the maintainer before writing code: the session in a store, a login client and protected routes.
- Everything through the proxy, like every request: the browser never talks to the backend, and the session cookie passes as it already does.

## Out of scope

The `login`, `session` and `logout` components ([components-next](components-next.md)).

## Done when

The test app signs in against a backend with Better Auth, shows the session and protects a route.

## Log

- 2026-10-24 · projects-thread · Split from the frontend feature when it closed. Taken after the error component.
