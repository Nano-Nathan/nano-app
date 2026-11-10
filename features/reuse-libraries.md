---
status: review
owner: claude
depends_on: []
updated: 2026-11-10
---

# Reuse the libraries instead of own code

## Goal

Where nano-app wrote by hand something its libraries already give (zod, Better Auth's client, Next's rewrite, TanStack Query), it uses the library: less code to maintain and no gaps a hand-made copy leaves. The framework does not decide the security of an app: it gives the consumer the place to do it.

## Scope

- `plugins/crud`: `schemas` per model (`insert`, `update`, `query`), zod schemas of the app; a body that breaks one answers 400. Nothing is checked without them. The client that knows no relations is created once per app, not per request.
- `plugins/rate-limit`: the token bucket stays (a fixed window lets a client spend two windows around its edge). An IPv6 client is its `/56` network, with `ipKeyGenerator` of `express-rate-limit`.
- `frontend` `AuthStore`: Better Auth's client (`createAuthClient`) in `auth`; the store keeps the session of the client at `/session`. Its own `signIn`, `signUp`, `signOut` and `readSession` go.
- `frontend` proxy: `/api/<store>/…` is a `NextResponse.rewrite` with the headers of the store, instead of a `fetch` and a copy of its answer. The guard of the pages asks Better Auth with a `fetch` to the backend.
- `core` `Validator`: route and store files are checked with zod schemas (`ROUTE`, `STORE`); a route file with an unknown key stops the startup.
- `components` forms: the form takes a zod `schema` of its values; `required`, `rules`, `errorMessage` and `validate` of a field go.
- `frontend` `ApiStore`: `gcTime: Infinity`, so a read is kept until a write, as the README says.
- Small cleanups: redundant defaults of `config.ts`, direct method lookup in `Endpoint`, the `app` store created once, `import.meta.dirname` in `health` and `crud`.

Out of scope: the client plugins of Better Auth in a store (a store file is JSON); `/busy` from TanStack's `isFetching()`.

## Decisions

Decided 2026-11-10: A1, B1, C1, D1.

- A. crud validation. **A1**: only what the app passes in `schemas`. A2: by default with the schema generated from each table.
- B. IPv6 key of `rate-limit`. **B1**: `ipKeyGenerator` of `express-rate-limit`. B2: the whole address, documented.
- C. Form schema. **C1**: one `schema` of the form. C2: a `schema` per field.
- D. Read cache. **D1**: `gcTime: Infinity`. D2: TanStack's 5 minutes, and fix the README.

## Log

- 2026-11-10 · claude · Plan approved by the maintainer with A1, B1, C1, D1; `rate-limit` keeps its token bucket by the maintainer's decision.
- 2026-11-10 · claude · Implemented on `refactor/reuse-libraries`. Not done, with its reason: `/busy` from `isFetching()` needs the writes moved to TanStack mutations, which is more code than the counter it replaces. Replaces `zod-rules` (rules by name in the field config). Tests run in CI.
