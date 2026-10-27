---
status: todo
owner: null
depends_on: []
updated: 2026-10-24
---

# Typed paths

## Goal

Path and resource mistakes show up when compiling, not at runtime.

## Scope

- Frontend: the type of the store paths comes from the `data` of each `*.store.ts` (template literal types), so `app.get('/demo/counter')` stops being `any` and a typo does not compile. Writing on what `get` returns instead of using `set` is blocked with readonly types.
- Backend: a `createRoute` typed with what the app injects (for example `defineApp<Deps>()`).

## Out of scope

The type of the controller in the view (done in `@nano-app/frontend`). The response contract (done in `@nano-app/backend`).

## Done when

In the test app, a mistyped store path and an injected resource that does not exist do not compile.

## Log
