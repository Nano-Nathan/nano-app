# @nano-app/frontend

Stores, controllers, views and the proxy to the backend, for Next.js.

```bash
pnpm add @nano-app/frontend
```

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- Next.js 16.3 and React 19 or newer, as peer dependencies.

## Entry points

| Import                      | Where             | Gives                                                    |
| --------------------------- | ----------------- | -------------------------------------------------------- |
| `@nano-app/frontend`        | client and server | `NanoAppProvider`, `Controller`, `createView`, the types |
| `@nano-app/frontend/next`   | `next.config.ts`  | `withNanoApp`                                            |
| `@nano-app/frontend/proxy`  | `proxy.ts`        | `proxy`                                                  |
| `@nano-app/frontend/server` | server only       | `createPage`, `getLocale`                                |

Types: `Controller`, `View`, `ComponentProps`, `Stores`, `Store`, `ApiStore`.

## withNanoApp

```ts
// next.config.ts
import { withNanoApp } from '@nano-app/frontend/next';

export default withNanoApp({});
```

Takes Next's config. At build time it loads the stores and the texts, and writes `nano-app-env.d.ts` next to `next.config.ts` with the type of each store. Add that file to `.gitignore`.

## NanoAppProvider

```tsx
<NanoAppProvider locale={sLocale}>{children}</NanoAppProvider>
```

Gives each React tree its own copy of the stores. `locale` starts the `app` store in that locale. `createLayout` of `@nano-app/mantine` already mounts it.

## Stores

A `src/stores/**/*.store.ts` default-exports a store, named after its path: `src/stores/admin/users.store.ts` → `admin_users`.

```ts
export default { type: 'app', data: { isOpen: false } };
```

| Key    | Description                                  |
| ------ | -------------------------------------------- |
| `type` | `'app'` for UI state, `'api'` for a backend. |
| `data` | The initial state.                           |

- `app` and `api` always exist, empty without a file. `app.store.ts` may make `app` an api store; `api.store.ts` must keep `api` of type `api`.
- `stores.app` is always typed `Store`, `stores.api` always `ApiStore`.

### Store

| Method             | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `get(path)`        | The value at `path`. A missing level reads as `undefined`. |
| `set(path, value)` | Sets the value, creating missing levels.                   |

### ApiStore

A store with a backend. Besides `get` and `set`:

| Method               | Keeps the answer | Description                                    |
| -------------------- | ---------------- | ---------------------------------------------- |
| `GET(path)`          | yes              | Reads `path`.                                  |
| `QUERY(path, query)` | yes              | Reads `path` with `query` as the JSON body.    |
| `POST(path, body)`   | no               | Creates.                                       |
| `PUT(path, body)`    | no               | Updates.                                       |
| `DELETE(path)`       | no               | Deletes.                                       |
| `get(path, query?)`  | —                | The answer a read kept at that path and query. |

- Each method returns a promise of the `ApiResponse`, with its HTTP `status`.
- A read keeps its answer over what was there: a field the new answer lacks stays from the last one.
- An answer without `success` is a failure. A non-JSON answer becomes `{ success: false, message: 'nano.error.requestFailed', result: <text> }`, and no answer `{ success: false, message: 'nano.error.requestFailed' }`.
- On the server (the first HTML render), a request asks nothing and resolves with `{}`.

| Path            | Holds                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `/message/list` | Each answer with a `message`, and each failed one, as an `ApiMessage` with `type` and `timestamp`. |
| `/requests`     | How many requests of the store are out.                                                            |

## Controller

```ts
export default class NotesController extends Controller {
  onMount(): Promise<unknown> {
    return this.stores.api.GET('/note');
  }
}
```

| Member              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `this.props`        | The props of the last render on screen.                                     |
| `this.stores`       | Every store of the app, typed by `nano-app-env.d.ts`.                       |
| `this.router`       | Next's router.                                                              |
| `this.pathname`     | Next's `usePathname()` of this render, without the query.                   |
| `text(key)`         | The text of `key` in the current locale; `i18n.<key>` without one.          |
| `setLocale(locale)` | Switches the locale, `<html lang>` and the cookie `nano-locale` (one year). |
| `onMount()`         | Runs once when the view mounts, never on the server.                        |
| `onUnmount()`       | Runs once when the view unmounts.                                           |

- Every method is bound once per mount and stays the same function while the view is mounted.
- Fields are set after the base constructor, so a field can read the context: `oApi = this.stores.backend;`.

## createView

```tsx
'use client';

export default createView(NotesController, (notes, props) => <ul>…</ul>);
```

- The file needs `'use client'`.
- The view gets the controller and the props of this render.
- It renders again only when a store path it read changes.
- Each mount has its own controller. `createView(Controller, …)` for a view that only reads stores.
- The view's only hook: a `useEffect` that calls a method when a value changes.

## Texts

`src/i18n/<locale>.i18n.ts` default-exports an object of one level, keys dotted:

```ts
export default { 'home.title': 'Inicio', 'nano.login.title': 'Bienvenido' };
```

- Loaded into the `app` store at `/i18n/<locale>`, over the framework's `nano.*` texts (`en` and `es`). An app's key replaces the framework's.
- The locale is `/locale` of the `app` store, `en` by default. `app.store.ts` sets the starting one.
- `/i18n` and `/locale` are the framework's: read them, and switch with `setLocale`.

### getLocale

`getLocale()` of `@nano-app/frontend/server` reads the cookie `nano-locale` in a server component. Reading it makes the page dynamic.

## Proxy

```ts
// src/proxy.ts
export { proxy } from '@nano-app/frontend/proxy';
export const config = { matcher: '/api/:path*' };
```

Each api store is served on `/api/<store>`, with its backend URL in `API_<STORE>_URL`:

| Store file             | Served on              | Variable              |
| ---------------------- | ---------------------- | --------------------- |
| (always)               | `/api/api/...`         | `API_API_URL`         |
| `admin/users.store.ts` | `/api/admin_users/...` | `API_ADMIN_USERS_URL` |

- `/api/api/users/7?top=1` → `$API_API_URL/users/7?top=1`. A backend `basePath` goes in the URL.
- URLs are read at runtime, once, on the server only.
- The request keeps its method, headers, cookies and body; the answer comes back as is, `Set-Cookie` and redirects included.
- The client IP goes in `X-Forwarded-For`, which Next fills only when the request brings none.
- Next reads `matcher` only from the app's own `proxy.ts`.
- A store without its URL answers `500` with the variable to define. Other paths go on to the app's routes.

## createPage

```tsx
import { createPage } from '@nano-app/frontend/server';

export default createPage({ redirect: '/login' }, ({ session }) => (
  <Dashboard user={session.user} />
));
```

| Option     | Default | Description                                                                           |
| ---------- | ------- | ------------------------------------------------------------------------------------- |
| `redirect` | —       | Where the page goes without a session (or with one, with `auth: false`).              |
| `store`    | `'api'` | The api store whose backend has Better Auth.                                          |
| `auth`     | `true`  | `false` for a page only without a session (a login). The view gets `session` as `{}`. |

- The view gets Next's props and `session`, Better Auth's `{ session, user }`.
- On each render the server asks `GET <API_<STORE>_URL>/auth/get-session` with the browser's cookie. A backend that moves Better Auth's `basePath` breaks it.
- The page only hides itself: the backend protects the data.
