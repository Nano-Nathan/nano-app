---
status: in-progress
owner: null
depends_on: []
updated: 2026-10-23
---

# Frontend

## Goal

`@nano-app/frontend` works end to end against the backend: the test app (`frontend/tests/app`, Next 16) reads and writes data, the package meets its image contract and is released from this repository.

## Done so far

Feature branch `feat/frontend`, from `main`.

- **Stores** (on `main`, #26 and #27): `withNanoApp(nextConfig)` in `@nano-app/frontend/next` loads the `*.store.ts` files in Node and passes them through `env`; `FileLoader.findMany` loads them (`admin/users.store.ts` → `admin_users`).
- **MobX** (#29): each `Store` owns its state (`observable(data)`); `set` writes inside `runInAction`, `get` returns the observable value.
- **Controllers and views** (#30, `9cf062a`): `createController(({ props, stores }) => methods)` in `src/controllers/<name>.controller.ts` returns `{ bindView(view) }`. `bindView` creates the component (`observer` + `useStores`); one view per call, one controller per view, several views may share a controller. Stores are a plain object `{ app, … }` of `Store`, created with `createStores()`; the store `app` always exists. The view receives `{ ...methods, props, stores }`. Controllers keep no state of their own: it lives in the stores.

Rejected during review, do not bring back: `useStore`, `createComponent`, `StoreManager`, controllers as classes, a `set` guard during render, a static (server) mode of the creator.

## Scope

One module per point, in this order: 1, 1b, 2, 3, 4. Each one is listed point by point with the maintainer before writing code. The design is new: do not start from the first milestone of the old copy (`nano-app.dev`).

1. **Proxy (connection).** Next 16 `proxy.ts` exported from `@nano-app/frontend/proxy`; the consumer re-exports it in one line. `/api/<store>/<endpoint>` goes to the URL of the store of type `api`: `url` in the store file, overridden by `<STORE>_URL` at runtime (proposal, waiting for OK). Only the connection, no config in `withNanoApp`. It replaces the server action design (actions are dispatched one at a time and are always `POST`, wrong for a store that reads a lot).
2. **Connection options (1b).** Headers per destination (keys of external systems), forwarding the browser cookie (login), and fail fast when the URL is missing.
3. **Store `api` and life cycle.** `stores.api` with `read`, `create`, `update` and `delete`, which store the result in a path; `busy` and the last `message` live in the store and the consumer draws them (no UI in the package). `onInit`/`onExit` in the controller, to read on mount. References from earlier decisions, to confirm: `read` is `GET`, and with a query it uses the HTTP `QUERY` method with core's `QueryParams` as JSON body; `create` is `POST`, `update` `PUT <path>/<id>`, `delete` `DELETE <path>/<id>`, and writes read again; `success: false` returns the `ApiResponse`, and only a non-JSON answer throws. Also here, when real controllers share logic: inheritance between controllers (proposal: composition with spread, or `extend`) and the folder of components (`src/components/` recommended, since "view" is already a page in Next). With this module the test app reads and writes.
4. **Image contract of the frontend.** Listens on `:80`, configured only by env at runtime, no `NEXT_PUBLIC_*` that depends on the environment. Written next to the backend's ([image-contract](image-contract.md)).
5. **Release.** `publish-frontend.yml` like `publish-plugins.yml`: `frontend/.releaserc.json` with `tagFormat: "frontend-v${version}"`, `paths: [frontend/**]`, a `test-frontend` job on every pull request (tests only when the diff touches `frontend/`) added as a required check, and an npm Trusted Publisher pointing to the workflow. npm already has `@nano-app/frontend` up to 0.3.6 (from `nano-app.dev`): the first release from here must be higher. Then the pull request from `feat/frontend` to `main`, whose title decides the release.

## Design rules

- The browser never talks to the backend directly: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin, nor on Better Auth (`packages.betterAuth` is optional). What the backend exposes and how it is protected is the consumer's decision, in the backend.
- No `glob` or `jiti` in the client bundle. No generated files in `node_modules`: build data goes through Next's `env`.

## Out of scope

Typed store paths ([typed-paths](typed-paths.md)). The response contract ([response-contract](response-contract.md)). Server-sent events ([sse](sse.md)).

## Ideas, not scope

- React Compiler (`reactCompiler: true` in `next.config.ts`): try it in the test app and check how it lives with `bindView` and `observer`.

## Done when

The test app starts and reads and writes data against the backend, its image meets the contract, and the package is released from `main`.

## Log

- 2026-10-22 · projects-d3 · Module 1 redesigned with the maintainer: a proxy instead of a server action. Points listed; waiting for OK on `<STORE>_URL` overriding the store `url`. Headers, cookies and fail fast moved to module 1b.
- 2026-10-23 · projects-b9 · Moved here from the planning folder outside the repo. To start module 1: switch to `feat/frontend`, `git pull`, create `feat/frontend--proxy`, list the points again and wait for OK.
