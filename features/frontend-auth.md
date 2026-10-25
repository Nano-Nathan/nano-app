---
status: review
owner: projects-thread
depends_on: []
updated: 2026-10-25
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
- 2026-10-25 · projects-thread · Agreed with the maintainer: an `api` store with `auth: '<basePath>'` is an `AuthStore` with `signIn(kind, body)`, `signUp(kind, body)`, `signOut()` and `readSession()`; Better Auth's answers come inside an `ApiResponse`; the session is kept at `/session` until the next sign-in, -up or -out; a 401 of that backend sets it to `null`. Protected pages use a layout bound to a controller (in the README and the test app), no server helper. No check of a backend without Better Auth; `cookiePrefix` with two backends only in the README.
- 2026-10-25 · projects-thread · Proposal, not in this feature: controller callbacks (an `onInit` run when a view mounts, apart from the methods so it never reaches the view). The session layout would read the session there instead of its `useEffect`: `createController(fnMethods, { onInit: ({ stores: { backend } }) => backend.readSession() })`.
- 2026-10-25 · projects-thread · Implemented on `feat/frontend-auth`, on top of the error component (#53). Checked in Chromium against a fake backend that answers like Better Auth: `/private` without a session goes to `/login`, a wrong password shows its error, signing in opens `/private`, a refresh keeps the session and signing out goes back to `/login`. Not checked against a real backend with Better Auth (no database here).
