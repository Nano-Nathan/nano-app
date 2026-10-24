---
status: todo
owner: null
depends_on: [frontend]
updated: 2026-10-24
---

# Frontend components

## Goal

`@nano-app/frontend` ships default components the way `@nano-app/plugins` ships plugins: the package gives the logic (a controller) and the consumer only writes the view.

## Scope

- Each default component is a controller exported by the package, bound by the consumer: `login.bindView(({ submit, busy }) => <form>…</form>)`. No UI in the package.
- Which components come first, their import path and their stores: listed point by point with the maintainer before code. Several (login) need the errors and auth modules of [frontend](frontend.md).

## Out of scope

Styles, markup or any UI kit.

## Done when

A default component is released and the test app renders it with its own view.

## Log

- 2026-10-24 · projects-thread · Proposed by the maintainer while planning the first frontend release.
