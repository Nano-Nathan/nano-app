---
status: todo
owner: null
depends_on: []
updated: 2026-11-10
---

# TanStack Query under the api store

## Goal

The cache of `ApiStore` (what a read keeps, when it asks the backend again, what a write invalidates) runs on `@tanstack/query-core` instead of code of our own, so that the next features of the store (in-flight dedup, retries, optimistic writes, pages that load more) are configured instead of written. The public API of the store (`read`, `get`, `create`, `update`, `delete`, `/busy`, `/error/list`) and the views do not change.

## Analysis

What exists today:

- `frontend/src/stores/ApiStore.ts` (143 lines): `request` (fetch to the proxy, `/busy`, `/error/list`, non-JSON answers), `receive` (hook for `AuthStore`), and the cache: `oVersions` per path, `oKept` per key, `keep` (merges the answer into the MobX state), `parents`, `key`, and the checks that drop an answer that comes back after a write.
- `frontend/src/stores/AuthStore.ts` extends it and keeps its own session cache (`oSession`); `components/list` and `field` call `read`.
- `frontend/tests/api.test.tsx` pins the behavior, including two races: a read answered after an `update` does not replace the update's answer, and a read answered after a write is asked again next time.

What `@tanstack/query-core` gives, checked in its docs and source (5.107.1, 2026-11-10):

- `QueryClient` without React: `fetchQuery` answers from the cache while the data is fresh, or asks; concurrent `fetchQuery` of the same key share one request.
- `fetchQuery` defaults `retry` to `false`: no behavior change unless we opt in.
- `invalidateQueries({ queryKey: ['/users'] })` matches by prefix: `['/users']` and `['/users', <query>]`, not `['/users/7']`. With the key `[path, query?]`, invalidating each parent reproduces today's rule (a write raises its path and its parents, whatever their query).
- `setQueryData` keeps an answer (today's `update`); `structuralSharing` can merge the new answer over the old one (today's `keep`).
- `gcTime` defaults to 5 minutes for queries with no observer. The store has no observers (MobX renders the views), so every kept answer would be dropped after 5 minutes: it must be `Infinity` to keep today's behavior.
- An invalidated query whose fetch was already out is marked fresh again when that fetch resolves. To keep the two races of the tests, a write must `cancelQueries` its paths first; a cancelled `fetchQuery` resolves with the previous data or rejects when there is none, never with the backend's answer. Today's contract ("an answer that comes back after a write is returned but not kept") changes: see decision 3.
- Focus and reconnect refetch, polling and other observer features need a `QueryObserver` per read; without observers they do not run.
- No official MobX binding. Community bridges exist (`mobx-tanstack-query`, about 2,000 weekly downloads; `mobbing-query`): small adoption, not used here.

What is reused: `request` and `receive` as they are (the `queryFn` is `request`), `/busy`, `/error/list`, the MobX state for the views, `AuthStore`.

Code balance, estimated: removes `oVersions`, `oKept` and the version checks (about 15 lines); adds the client with its defaults, `fetchQuery`, the cancellation and the invalidations (about 15 lines). The change is about even in lines today: what it buys is in-flight dedup now, and the later features as options.

## Scope

1. Each `ApiStore` owns one `QueryClient` with `gcTime: Infinity` and `staleTime: Infinity`: an answer is kept until a write on its path or a parent.
2. `read(path, query?)` asks `fetchQuery({ queryKey: [path, query], queryFn })`, where `queryFn` is today's `request` with `GET` or `QUERY`; it copies the answer into the MobX state with today's merge. On the server it asks nothing, as today.
3. `create`, `update` and `delete` send their request as today, then cancel and invalidate `[parent]` for the path and each parent (`refetchType: 'none'`: the next read asks).
4. A successful `update` keeps its answer with `setQueryData([path])` and in the MobX state, as today.
5. `AuthStore` keeps its session cache as is (decision 4).
6. `@tanstack/query-core` becomes a dependency of `@nano-app/frontend` (not a peer: the consumer never touches it).
7. README of the frontend: the reading and writing section keeps its rules; the race rule changes as decided; a line says the cache runs on TanStack Query.

## Out of scope

`@tanstack/react-query` and its hooks (views keep reading the stores); observers, focus and reconnect refetch, polling; retries, optimistic writes and infinite pages (each one a later feature, now an option); the session cache of `AuthStore`.

## Done when

`frontend/tests/api.test.tsx` passes with only the changes the decisions below accept, a new test shows that two concurrent reads of the same path send one request, the `components` suites pass, and `next build` of `frontend/tests/app` passes.

## Modules

| # | Task | Does | Done when | Depends on |
|---|---|---|---|---|
| 1 | Spike | Checks, in a scratch test against `query-core`, the two races (cancel then invalidate; cancel then `setQueryData`) and what a cancelled `fetchQuery` resolves with | A short report in the log, per race: kept as today, or the exact new behavior | — |
| 2 | Cache on query-core | Points 1 to 4 and 6 | The api suite passes as decided, with the dedup test | 1 |
| 3 | Docs | Point 7 | README and this file follow the decisions | 2 |

One branch and one pull request (`feat(frontend): …`), unless the maintainer splits it.

## Decisions

1. Go or no-go.
   - **A (recommended)**: go, for in-flight dedup now and the later features as options, accepting that it does not reduce lines today.
   - B: no-go: keep the own cache until a feature (dedup, retries, infinite pages) is asked for, and take this file then.
2. One `QueryClient` per store or per tree.
   - **A (recommended)**: per `ApiStore`. The key needs no store name, and each store keeps its own defaults.
   - B: one per tree in `createStores`, with the store name first in every key. One place to configure, one more key level.
3. A read whose answer comes back after a write on its path.
   - **A (recommended)**: the write cancels it; `read` resolves with what the cache had before (or asks again when it had nothing). Contract: "a read cancelled by a write resolves with the store's answer, not the backend's late one". Least code.
   - B: keep today's contract (the late answer is returned, not kept): `queryFn` checks a version per path, as today. About 6 lines of the current logic stay.
4. The session cache of `AuthStore`.
   - **A (recommended)**: stays as is (`oSession`). It is 5 lines and has its own rules (401 clears it, sign-in reads it again).
   - B: becomes a query `['get-session']`, invalidated by sign-in, sign-up, sign-out and 401. Same lines, one cache.

## Risks

- `query-core` is used imperatively, without observers: most of its documentation assumes them. The spike pins the behavior the store relies on, and the api suite covers it.
- Two caches hold each answer (TanStack's and the MobX state). They are written together in `read` and `update`; a later feature that writes only one of them breaks the views.
- A dependency in the client bundle (about 13 kB gzipped, to be measured in `next build`).

## Log

- 2026-11-10 · claude · Plan written from the analysis above (`ApiStore`, its tests, `query-core` 5.107.1 docs and source). Waiting for the first round of decisions; module 1 starts after them.
