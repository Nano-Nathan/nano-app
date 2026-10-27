---
status: in-progress
owner: projects-thread
depends_on: []
updated: 2026-10-27
---

# Next components

## Goal

More components in `@nano-app/components`, the same way as `list`: a factory that returns a controller, its state in its api store, and the consumer writes the view.

## Scope

- `form`: shows its errors with the `error` component.
- `auth`: the sessions of an `api` store ([frontend README](../frontend/README.md#sessions)) and `navTo(url)`, one controller for the login, the logout and the private layout.
- Each one listed point by point with the maintainer before writing code.

## Out of scope

Styles, markup or any UI kit.

## Done when

`form` and `auth` are released and the test app renders them with its own views.

## Log

- 2026-10-24 · projects-thread · Split from frontend-components when `list` was released and the test app rendered it.
- 2026-10-27 · projects-thread · Started `login`: points listed to the maintainer, waiting for the OK.
- 2026-10-27 · projects-thread · `login`, `session` and `logout` became one `auth` component: `auth({ kind, store })` gives `signIn(body)`, `signUp(body)`, `signOut()`, `load()` and `navTo(url)` (Next's `router.push`). Components connect by nesting views with props (the form gets `onSubmit`). Implemented on `feat/components-auth`.
- 2026-10-27 · projects-thread · `auth` merged to `main` (#61). Missing: `form`.
