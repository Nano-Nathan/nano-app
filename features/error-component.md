---
status: todo
owner: null
depends_on: []
updated: 2026-10-24
---

# Error component

## Goal

`@nano-app/components/error` helps an app show and handle the errors of its api stores, so each view does not handle them by hand.

## Today

- A read and a write return a promise of the `ApiResponse` also when the backend fails (`success: false`, `message`), and reject when there is no answer or it is not JSON. The controller that called them handles both, and a read keeps its `ApiResponse` in the store for the views.

## Scope

- Listed point by point with the maintainer before writing code: what the component gives its view (a queue to show and dismiss, the error of one path), and whether writes also go through it.

## Out of scope

Status codes of the backend ([response-contract](response-contract.md)): the component reads the `message`, and a `status` is added when that contract has it.

## Done when

The test app shows a failed read and a failed write with the component and its own view.

## Log

- 2026-10-24 · projects-thread · Split from the frontend feature when it closed: the maintainer chose a component over a module of the frontend.
- 2026-10-24 · projects-thread · Reads now return the `ApiResponse` like writes, and keep it in the store.
