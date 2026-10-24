---
status: todo
owner: null
depends_on: []
updated: 2026-10-24
---

# Response contract

## Goal

Close the backend response contract before apps are built on it and before freezing the API in 1.0.

## Problem

`Endpoint.handler` only produces 200 (`success: true`), 400 (anything else) and 405. No 201, 204, 404, 409, headers, cookies or streaming: the handler does not receive `res`.

## Scope

- Decide with the maintainer, with cost and a recommendation before implementing:
  - `status?: number` in `ApiResponse`;
  - the handler returns `void` when it already answered;
  - a third `ctx` parameter with `res`, `next` and helpers.
- The frontend follows the chosen contract (it consumes `ApiResponse`).

## Out of scope

Automatic CRUD ([automatic-crud](automatic-crud.md)).

## Done when

A handler answers 201, 404 and 409 without throwing, and the frontend sees them.

## Log
