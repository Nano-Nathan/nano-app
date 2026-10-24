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
- **Proxy** (#33): `@nano-app/frontend/proxy` exports `proxy`; the consumer re-exports it in one line in `proxy.ts` (no `config`: Next ignores a re-exported one) and nano-app does not check it. Every `/api/<name>/<path>?<query>` goes to `API_<NAME>_URL/<path>?<query>`, read at runtime on the server (500 with the variable to define when it is missing); outside `/api/<name>` the request goes on to Next. All `/api` routes go through stores. It sends the request with `fetch` (method, headers, cookies, body) and returns the answer as is, `Set-Cookie` included: a rewrite would show the backend URL in `x-middleware-rewrite`. The store type `api` exists (`{ type: 'api' }`, no `url`: the stores reach the client bundle).
- **Connection options** (1b): a store declares `headers: { 'x-api-key': 'STRIPE_KEY' }` (`Validator` checks an object of strings) and the proxy sends the value of `API_STRIPE_KEY_HEADER`, over the browser's header of the same name. The proxy reads the variables on each request (reading `process.env` costs nothing; a cache was rejected as code without gain). No fail fast: a missing variable answers 500 with its name, and the URL never reaches the browser.
- **Store `api`** (3): an `api` store is an `ApiStore` with `read(path, query?)`, `create`, `update`, `delete` and `busy`, no `get`/`set`. `read` works in the render: it answers from local and asks the backend (`GET`, or `QUERY` with the query as body) when the key (path + query) was not asked with its entity's (first segment) current version: the version is kept when the request leaves, so it is asked once. A write raises its entity's version when its answer comes back, so a read answered after a write is asked again. A read keeps its answer's `result`, nothing else (no validation, no fallback); a failed request rejects until the errors module. `update` and `delete` take the full path. Writes return the `ApiResponse`. On the server `read` asks nothing (`IS_SERVER` in `core/const.ts`, shared with `createController`): the browser asks on hydrating. The test app reads and writes `/users`.

Rejected during review, do not bring back: `useStore`, `createComponent`, `StoreManager`, controllers as classes, a `set` guard during render, a static (server) mode of the creator.

## Scope

One module per point, in this order: errors, auth, 4, 5. Each one is listed point by point with the maintainer before writing code. The design is new: do not start from the first milestone of the old copy (`nano-app.dev`).

- **Errors of the `api` stores.** How the front shows a failed read or write (a queue for every store was discussed: `{ message, api, read }`). Listed point by point before code.
- **Later, when real controllers ask for it:** `onInit`/`onExit` in the controller, inheritance between controllers, a framework debounce, dropping old reads, reading what other users change (by time, or with [sse](sse.md)), `PATCH`.
- **Auth in the frontend.** With Better Auth on (#34, `packages.betterAuth` of the backend): the session in a store, a login client and protected routes; without it, nothing. Through the proxy like every request. Listed point by point after module 3.
- **4. Image contract of the frontend.** Listens on `:80`, configured only by env at runtime, no `NEXT_PUBLIC_*` that depends on the environment. Written next to the backend's ([image-contract](image-contract.md)).
- **5. Release.** `publish-frontend.yml` like `publish-plugins.yml`: `frontend/.releaserc.json` with `tagFormat: "frontend-v${version}"`, `paths: [frontend/**]`, a `test-frontend` job on every pull request (tests only when the diff touches `frontend/`) added as a required check, and an npm Trusted Publisher pointing to the workflow. npm already has `@nano-app/frontend` up to 0.3.6 (from `nano-app.dev`): the first release from here must be higher. Then the pull request from `feat/frontend` to `main`, whose title decides the release.

## Design rules

- The browser never talks to the backend directly: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin. Better Auth is optional: the frontend uses it only when the backend has it on. What the backend exposes and how it is protected is the consumer's decision, in the backend.
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
- 2026-10-23 · projects-thread · Module 1 approved and implemented in `feat/frontend--proxy`: store type `api`, URL only from `API_<STORE>_URL` at runtime (no `url` in the file, it would reach the bundle), `@nano-app/frontend/proxy` exports `proxy`, the consumer re-exports it in one line and nano-app does not validate it. The proxy sends the request with `fetch` (a rewrite shows the backend URL to the browser in `x-middleware-rewrite`), so cookies and `Set-Cookie` already pass: 1b keeps headers per destination and fail fast. Proposal: a module "auth in the frontend" (Better Auth session in a store, login client, protected routes), after `feat/core-auth` reaches `main`.
- 2026-10-23 · projects-thread · Review of #33: the proxy does not read the stores. Every `/api/<name>` goes to `API_<NAME>_URL` (500 when it is missing); `readStoreFiles` removed.
- 2026-10-23 · projects-thread · Merged #33 (module 1) and `main` (#34, Better Auth in the core). Next: module 1b.
- 2026-10-23 · projects-thread · Module 1b approved and implemented in `feat/frontend--connection-options`: headers per store from `API_<VALUE>_HEADER`, the store's header wins, env read once in `ProxyEnv`, no fail fast (decided: let it fail with the variable's name).
- 2026-10-23 · projects-thread · Review of #38: `ProxyEnv` removed, the proxy reads the env on each request.
- 2026-10-23 · projects-thread · Module 3 approved and implemented in `feat/frontend--api-store`: versions per entity instead of reading again after a write, `read` instead of `get`, no `message` in the store (errors go to their own module), no `onInit`/`onExit` (reads work in the render). Our own code over TanStack Query: same design, no dependency, MobX-native.
- 2026-10-23 · projects-thread · Review of #40: `ApiStore` simplified. No JSON check (a non-JSON answer rejects by itself), no "keep the old data" on a failed read, one `oRead` with the version each key left with instead of a pending Set, failed requests not caught until the errors module, `update`/`delete` take the full path. `read` asks nothing on the server (the proxy is only reachable from the browser; SSR with data would be its own module). Whole PR checked against CLAUDE.md (comments per step, 100 columns, prefixes).
