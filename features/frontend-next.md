---
status: review
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
- Controllers as classes (2026-11-17): `Controller` holds `props`, `stores` and `router`, binds its methods once per instance and has `onMount`/`onUnmount` as plain methods; inheritance with `extends`/`super` replaces `extend` and `callbacks`. `createView(Controller, view)` makes one instance per mount, sets `this.props` in `useLayoutEffect` (a method sees the props of the last render on screen) and renders `view(controller, props)`. Rejected: spreading the instance into the view (copies each render, loses getters), an unbound instance with a "do not destructure" rule, `render()` inside the class, MobX `autoBind` (no subclasses).
- `enableStaticRendering` moved to `NanoAppProvider`.
- Route protection: `createPage` in `@nano-app/frontend/server`: a server component asks Better Auth's `get-session` at the store's backend and redirects without a session. Every kind of auth (cookie, API key, bearer, client credentials, JWT) is verified by Better Auth in the backend; the frontend only carries the cookie.
- `@nano-app/components` as classes (2026-11-17): `AuthController`, `FieldController`, `FormController`, `ErrorController` and `CollectionController` (was `list`); options are fields the subclass sets, `abstract` without a default (rejected: a factory that returns a class, static options, options in `createView`, a shared instance). `ApiController` holds `store` and `api()`. Peer `@nano-app/frontend >=0.16.0`. `tests/app` on the new API; `/private` uses `createPage`.
- `Stores` always has `app: Store`; `withNanoApp` writes the others (an api `app` store is typed `Store`).
- Tests and README rewritten for the current code: `AuthStore`, store headers, `auth.routes`, the default store and the read cache are gone; the proxy without URLs is tested in its own process (`missing.test.ts`), as the URLs are read once when the module loads.
- `withNanoApp` writes `nano-app-env.d.ts` in the app (not in `.next/types`: Next empties its `distDir` on build) with the type of each store, through module augmentation of `Stores` (an `interface`, the only kind that merges). The runtime `Proxy` is gone: a missing store is a type error. `createStores` moved into `NanoAppProvider`, its only caller (`useState`, once per tree: never at module level, the server would share one set across requests).

## Where each part runs today

| Part                      | Runs                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `withNanoApp`             | Node, when Next reads `next.config.ts` (build and dev)                                              |
| `NANO_APP_STORES`         | Written in every bundle by `compiler.define`, the browser's included                                |
| `NANO_APP_BACKENDS`       | Written in the server bundles only by `compiler.defineServer`: `[store, env var]` of each api store |
| `proxy.ts`                | Node, on every request (no `matcher`); only `/api/*` goes on                                        |
| `NanoAppProvider`, stores | Once per request in the SSR and once in the browser                                                 |
| `createView`              | SSR and browser; one controller instance per mount, methods bound once                              |
| `ApiStore.send`           | Browser only (`{}` on the server), `fetch('/api/<store>/<path>')`                                   |

## Pending

1. **`createPage`**: no unit test (it needs Next's request scope for `headers()`); checked in `tests/app` (`/private`).

## Next.js options that help (checked in `next.config` docs and `config-shared.ts`, canary)

- `env`, `compiler.define`: values in every bundle. `compiler.defineServer`: server bundles only.
- `rewrites`, `redirects` (`has`/`missing`), `headers`: built at build time (see Option A).
- `instrumentationInject`: code before `instrumentation` with no app file (16.5).
- `experimental.proxyTimeout`: timeout of the rewrites to an external URL.
- `experimental.authInterrupts`: `unauthorized()` and `forbidden()`.
- `output: 'standalone'`: copies the `.env` of the build as defaults; vars set at start win (does not apply to `rewrites`, already baked).

## Next step

Pull request to `main`; then finance moves to the new API.
