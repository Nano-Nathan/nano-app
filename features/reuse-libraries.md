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

- `plugins/crud`: `validations` per model (`insert`, `update`, `query`), zod schemas of the app; a body that breaks one answers 400. Nothing is checked without them. Its `schema` option is now `dbSchema`. The client that knows no relations is created once per app, not per request.
- `plugins/rate-limit`: the token bucket stays (a fixed window lets a client spend two windows around its edge). An IPv6 client is its `/56` network, with `ipKeyGenerator` of `express-rate-limit`.
- `frontend` `AuthStore`: `signIn`, `signUp` and `signOut` run on Better Auth's client (`createAuthClient`), private to the store, for any kind; the store keeps the session of the client at `/session`. `readSession` goes: the session is read when the app starts.
- `frontend` proxy: `/api/<store>/…` is a `NextResponse.rewrite` with the headers of the store, instead of a `fetch` and a copy of its answer. The guard of the pages asks Better Auth with a `fetch` to the backend.
- `core` `Validator`: route and store files are checked with zod schemas (`ROUTE`, `STORE`); a route file with an unknown key stops the startup.
- `components` forms: each field takes its `validation`, a zod schema; `required`, `rules`, `errorMessage` and `validate` of a field go. A rule between fields goes in the `onSubmit` of the form.
- `frontend` `ApiStore`: `gcTime: Infinity`, so a read is kept until a write, as the README says.
- Small cleanups: redundant defaults of `config.ts`, direct method lookup in `Endpoint`, `import.meta.dirname` in `health` and `crud`.
- `.claude/CLAUDE.md` holds only the code guidelines and the clean core; the rules of the repository and the planning of a development moved to `CONTRIBUTING.md`.

Out of scope: the other endpoints of Better Auth (social, password reset) from the store; `/busy` from TanStack's `isFetching()`.

## Decisions

Decided 2026-11-10: A1, B1, C1, D1.

- A. crud validation. **A1**: only what the app passes in `schemas`. A2: by default with the schema generated from each table.
- B. IPv6 key of `rate-limit`. **B1**: `ipKeyGenerator` of `express-rate-limit`. B2: the whole address, documented.
- C. Form schema. C1: one `schema` of the form. **C2**: a zod schema per field (`validation`), chosen in the review of the pull request over C1.
- D. Read cache. **D1**: `gcTime: Infinity`. D2: TanStack's 5 minutes, and fix the README.

## Log

- 2026-11-10 · claude · Plan approved by the maintainer with A1, B1, C1, D1; `rate-limit` keeps its token bucket by the maintainer's decision.
- 2026-11-10 · claude · Implemented on `refactor/reuse-libraries`. Not done, with its reason: `/busy` from `isFetching()` needs the writes moved to TanStack mutations, which is more code than the counter it replaces. Replaces `zod-rules` (rules by name in the field config). Tests run in CI.
- 2026-11-11 · claude · Review of the maintainer on the pull request: the client of Better Auth is private to `AuthStore`, which keeps `signIn(kind, body)`, `signUp` and `signOut` answering an `ApiResponse`; each field has its `validation` and its one error message, the form takes no schema; crud's options are `dbSchema` and `validations`; the default `app` store wins over the app's file again (the cleanup had changed it); `CLAUDE.md` reduced to code guidelines. Still open for the maintainer: the strict route files and the session read when the app starts.
