---
status: review
owner: projects-thread
depends_on: []
updated: 2026-10-27
---

# Response contract

## Goal

Close the backend response contract before apps are built on it and before freezing the API in 1.0.

## Problem

`Endpoint.createHandler` only produces 200 (`success: true`) when the handler returns, any status it throws (`{ status, message }`, a string is 400) and 405. A success is always 200, and there are no 201, 204, headers, cookies or streaming: the handler does not receive `res`.

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

- 2026-10-27 · projects-thread · The handler returns `status` (HTTP status, 200 by default) and the framework sets `success` to `status < 400`; `status` is not sent in the body. Headers, cookies, streaming, a handler returning `void` and a `ctx` with `res` stay out, as proposals.
