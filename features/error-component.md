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

- A write (`create`, `update`, `delete`) returns its `ApiResponse` also when the backend fails (`success: false`, `message`), and rejects when there is no answer or it is not JSON. The controller that called it can handle both.
- A read keeps `undefined` when it fails, and its error does not reach the view: a failed request is a rejection nobody catches.

## Scope

- Listed point by point with the maintainer before writing code: where a failed read leaves its error so a view can read it, what the component gives its view (a queue to show and dismiss, the error of one path), and whether writes also go through it.

## Out of scope

Status codes of the backend ([response-contract](response-contract.md)): the component reads the `message`, and a `status` is added when that contract has it.

## Done when

The test app shows a failed read and a failed write with the component and its own view.

## Log

- 2026-10-24 · projects-thread · Split from the frontend feature when it closed: the maintainer chose a component over a module of the frontend.
