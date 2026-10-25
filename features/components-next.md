---
status: todo
owner: null
depends_on: [frontend-auth]
updated: 2026-10-24
---

# Next components

## Goal

More components in `@nano-app/components`, the same way as `list`: a factory that returns a controller, its state in its api store, and the consumer writes the view.

## Scope

- `form`: shows its errors with the `error` component.
- `login`, `session` and `logout`: need [auth in the frontend](frontend-auth.md).
- Each one listed point by point with the maintainer before writing code.

## Out of scope

Styles, markup or any UI kit.

## Done when

`form` and `login` are released and the test app renders them with its own views.

## Log

- 2026-10-24 · projects-thread · Split from frontend-components when `list` was released and the test app rendered it.
