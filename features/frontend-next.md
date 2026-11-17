---
status: in-progress
owner: claude
depends_on: []
updated: 2026-11-17
---

# Frontend on Next, with less manual logic

`@nano-app/frontend` goes back to Next (restored to `4c3755f`, on `refactor/frontend`) and drops the logic Next already gives. The frontend and the backend stay separate services, so the browser reaches the backends through the frontend.

## Decisions

- Next is the base; Vike, React Router 8 and the rest were dropped (Vike's `+` files are mandatory).
- The stores stay as they are: `Store`, the `app` state and the `.store.ts` files. `ApiStore` may change.
- `withNanoApp` only finds and validates the `.store.ts` files and writes them in every bundle with `compiler.define` (`NANO_APP_STORES`, JSON `[name, file]` pairs read with `JSON.parse`, so no cast).
- No `src/react` or `src/public` folder for the entry points: the layout stays as it is.
- Env vars stay in the environment (secrets and per-deploy URLs), not in a file nor in the `.store.ts`.
- A missing env var is validated on the first request, not at start (`instrumentationInject` is Next 16.5, canary only).

## Done

- Proxy, option B (2026-11-16): one file in the app is the price of a runtime URL that also runs on Vercel and `standalone`; no file at all needs `rewrites` (URL fixed at build, one image per environment) or a custom server (no `standalone`, no Vercel). The URL table and the missing vars are read once; `/api/<store>/<path>` is the only rule. A Route Handler (option C) was dropped: it answers 405 to `QUERY`.
- Store headers removed: they reached the browser through `NANO_APP_STORES` (names only) and the env name was built.
- Default store special case removed: `api` is a store like any other (`/api/api/...`, `API_API_URL`).
- `next.ts`: no security headers, no `poweredByHeader`; only the env.
- `const.ts`: `SECURITY_HEADERS` removed.
- `README.md`: the security headers paragraph removed.
- `tests/stores.test.ts`: the security headers test removed.
- `createController` (2026-11-17): one function per method for the whole mount, calling the method of the last committed render (`useLayoutEffect`); `onMount` and `onUnmount` see the last render. A method called while rendering sees the props of the render before. A getter `props` was dropped (destructuring it freezes the value); writing the ref while rendering was dropped (React's ref rule).
- `enableStaticRendering` moved to `NanoAppProvider`.
- `withNanoApp` writes `nano-app-env.d.ts` in the app (not in `.next/types`: Next empties its `distDir` on build) with the type of each store, through module augmentation of `Stores` (an `interface`, the only kind that merges). The runtime `Proxy` is gone: a missing store is a type error. `createStores` moved into `NanoAppProvider`, its only caller (`useState`, once per tree: never at module level, the server would share one set across requests).

## Where each part runs today

| Part                      | Runs                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `withNanoApp`             | Node, when Next reads `next.config.ts` (build and dev)                                              |
| `NANO_APP_STORES`         | Written in every bundle by `compiler.define`, the browser's included                                |
| `NANO_APP_BACKENDS`       | Written in the server bundles only by `compiler.defineServer`: `[store, env var]` of each api store |
| `proxy.ts`                | Node, on every request (no `matcher`); only `/api/*` goes on                                        |
| `NanoAppProvider`, stores | Once per request in the SSR and once in the browser                                                 |
| `createController`        | SSR and browser; methods built on each render, one stable function per method per mount             |
| `ApiStore.send`           | Browser only (`{}` on the server), `fetch('/api/<store>/<path>')`                                   |

## Pending

1. **Route protection**: `createPage` in `@nano-app/frontend/server` (done): a server component asks Better Auth's `get-session` at the store's backend and redirects without a session. Every kind of auth (cookie, API key, bearer, client credentials, JWT) is verified by Better Auth in the backend; the frontend only carries the cookie.
2. **Tests**: they no longer match the code (auth, `AuthStore`, store headers, default store); update them apart.
3. `pnpm install` is pending (ask first).

## Next.js options that help (checked in `next.config` docs and `config-shared.ts`, canary)

- `env`, `compiler.define`: values in every bundle. `compiler.defineServer`: server bundles only.
- `rewrites`, `redirects` (`has`/`missing`), `headers`: built at build time (see Option A).
- `instrumentationInject`: code before `instrumentation` with no app file (16.5).
- `experimental.proxyTimeout`: timeout of the rewrites to an external URL.
- `experimental.authInterrupts`: `unauthorized()` and `forbidden()`.
- `output: 'standalone'`: copies the `.env` of the build as defaults; vars set at start win (does not apply to `rewrites`, already baked).

## Next step

Update the tests (pending 2).
