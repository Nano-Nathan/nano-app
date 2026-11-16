# @nano-app/frontend

[![frontend](https://img.shields.io/npm/v/@nano-app/frontend?label=frontend)](https://www.npmjs.com/package/@nano-app/frontend)

Frontend of [nano-app](https://github.com/Nano-Nathan/nano-app) for Next.js apps: UI state in stores, and controllers whose methods the views use.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- Next.js 16.3 and React 19 or newer, as peer dependencies.

## Quick start

```bash
pnpm add @nano-app/frontend
```

```ts
// next.config.ts
import { withNanoApp } from '@nano-app/frontend/next';

export default withNanoApp({});
```

```tsx
// app/layout.tsx
import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <NanoAppProvider>{children}</NanoAppProvider>
      </body>
    </html>
  );
}
```

## Stores

A `src/stores/**/*.store.ts` is a store of UI state, named after its path (`src/stores/admin/users.store.ts` → `admin_users`). `withNanoApp` loads them at build time; `NanoAppProvider` gives each React tree its own copy. The `app` store is always there, empty when the app has no `app.store.ts`; its file may make it an `api` store too.

```ts
// src/stores/ui.store.ts
export default { type: 'app', data: { isOpen: false } };
```

Each store reads and writes by path: `app.get('/drawer/isOpen')`, `app.set('/drawer/isOpen', true)`. A missing level reads as `undefined`, and `set` creates it.

## Controllers and views

A controller holds the methods; a view binds to one controller and gets its methods, the props, the stores and `router` (since 0.7, Next's `useRouter()`, to navigate without hooks). Several views can bind to the same controller.

```ts
// src/controllers/counter.controller.ts
import { createController } from '@nano-app/frontend';

export default createController(({ props, stores: { app } }) => ({
  increment(): void {
    app.set('/iCount', app.get('/iCount') + 1);
  },
}));
```

```tsx
// src/components/Counter.tsx
'use client';

import counterController from '../controllers/counter.controller';

export default counterController.bindView(({ stores: { app }, increment }) => (
  <button onClick={increment}>{app.get('/iCount')}</button>
));
```

- A file that calls `bindView` needs `'use client'`. A component without stores or methods is a plain React function and can stay a server component.
- The view re-renders only when a store path it read changes.
- The context has `props`, `stores` and `router`; a method with one of those names is hidden by it. Reading a store the app does not have (`stores.missing`) throws naming the store file to add.
- Before its `return`, the function only keeps what it reads from the context (`const oApi = stores.backend;`). A method reaches the others with `this` (`last() { return this.items()[0]; }`), also when the view calls it alone; `this` needs the method syntax, not an arrow. `onMount` gets the same `this`.

`callbacks` (since 0.7), first in that object, is not a method: `onMount` runs once when each bound view mounts (never on the server), to read what the view needs, and `onUnmount` once when it unmounts. To act when a value changes, the view calls a method from a `useEffect` with that value as its dependency (see [Sessions](#sessions)); the logic stays in the method.

```ts
export default createController(({ stores: { backend } }) => ({
  callbacks: {
    onMount(): Promise<unknown> {
      return backend.read('/users');
    },
  },
  users(): unknown[] {
    return backend.get('/users')?.result ?? [];
  },
}));
```

`extend` returns a new controller with your methods merged over its own: a method with the same name replaces the original, the others stay, and the original controller does not change. Both `onMount` run, the original's first. Its methods receive the same context (`props`, `stores`, `router`) as the controller's, and reach the controller's methods and their own with `this`.

```ts
export default counterController.extend(({ stores: { app } }) => ({
  reset(): void {
    app.set('/iCount', 0);
  },
  double(): void {
    this.increment();
    this.increment();
  },
}));
```

The types of a controller and its views come from `@nano-app/frontend`: `Controller`, `View`, `ComponentContext` (`props`, `stores` and `router`), `ComponentProps` and `ControllerCallbacks`.

## Backend

A store of type `api` connects the app to a backend. The browser never talks to the backend: it calls `/api/...` on the Next server, and the proxy sends the request there. The proxy is a [rewrite](https://nextjs.org/docs/app/api-reference/functions/next-response#rewrite) of Next: Next sends the request to the backend and answers with what it answers.

```ts
// src/stores/api.store.ts
export default { type: 'api' };
```

```ts
// proxy.ts, next to app/
export { proxy } from '@nano-app/frontend/proxy';
export const config = { matcher: '/api/:path*' };
```

Each api store is served on `/api/<store>`, with its backend URL in `API_<STORE>_URL` (`api.store.ts` → `/api/api/...` and `API_API_URL`, `admin/users.store.ts` → `/api/admin_users/...` and `API_ADMIN_USERS_URL`; `/api/api/users/7?top=1` → `$API_API_URL/users/7?top=1`). The components use the store `api` when they name none. The URLs are read at runtime, once, on the server only: they never reach the browser. A backend with a `basePath` puts it in the URL (`API_API_URL=http://backend:3000/api`).

- The request keeps its method, headers, cookies and body, and the backend's answer comes back as is, `Set-Cookie` and redirects included.
- The proxy sends every header of the browser to the backend, cookies included: point a store only at a backend you trust with your users' cookies.
- The client IP reaches the backend in `X-Forwarded-For`, which Next fills only when the request brings none. Put a proxy in front of Next that appends the client IP (nginx, a load balancer, Tailscale Funnel): with Next exposed directly, a browser that sends its own header chooses the IP it is counted by. See [Client IP](../backend/README.md#client-ip).
- The `matcher` keeps Next from running the proxy on every other request (pages, `_next/static`, images). Next reads it only when it is written in the app's `proxy.ts`: re-exported from the package, it is ignored. Without it the proxy still works, letting every other request go on. Keep it on `/api`, the path of the proxy.
- While an api store has no URL, every `/api/` request answers 500 with the variables to define. `/api/<name>` of no api store, and any request outside `/api/`, goes on to the app's own routes.

### Reading and writing

An `api` store reads and writes its backend. The controllers read and write; the views get what a read kept. It also has its own state like any store (`get`, `set`, and `data` in its file): UI state about that backend (a page, an order) can live next to it.

```ts
// src/controllers/users.controller.ts
export default createController(({ stores: { backend } }) => ({
  callbacks: {
    onMount(): Promise<unknown> {
      return this.load();
    },
  },
  load(): Promise<unknown> {
    return backend.read('/users');
  },
  async add(sName: string): Promise<unknown> {
    await backend.create('/users', { name: sName });
    return this.load();
  },
}));
```

```tsx
// src/components/Users.tsx
export default usersController.bindView(({ stores: { backend }, add }) => (
  <ul onClick={() => add('Bruno')}>
    {(backend.get('/users')?.result ?? []).map(oUser => (
      <li key={oUser.id}>{oUser.name}</li>
    ))}
  </ul>
));
```

- `read(path, query?)` returns a promise of the `ApiResponse` and keeps it in the store for that path and query, over what the store had there (a field the new answer does not bring stays from the last one). The view gets it with `get(path, query?)`, and renders again when a read keeps a new one.
- A read answers from the store until a write on its path or a parent; otherwise it asks the backend (`GET`, or `QUERY` with the query as JSON body). Reads of the same path and query that are out at once send one request. A read still out when a write on its path answers is cancelled: its promise rejects with `CancelledError`. The cache runs on [TanStack Query](https://tanstack.com/query) (`@tanstack/query-core`), without its hooks.
- `create` (`POST <path>`), `update` (`PUT <path>`) and `delete` (`DELETE <path>`) return a promise of the `ApiResponse` and, once answered, invalidate their path and its parents (`update('/users/7')` invalidates `/users/7` and `/users`), so their next reads ask the backend, whatever their query. Other paths keep what they have.
- A successful `update` also keeps its `ApiResponse` at its path, over what the store had there: its next read answers from the store. `create` and `delete` keep nothing.
- `more(path, query)` reads a list page after page: each call adds the next page (`QUERY` with `offset`), and `get(path, query)` gives every page read so far in one `ApiResponse`, its items in order in `result`. A page with fewer items than `query.limit` is the last one: later calls ask nothing. While a view shows them (`watch(path, query)` when it mounts, `unwatch(path, query)` when it unmounts), a write on the path reads every page again; with no view, a write only marks them old, and the next `watch` reads them all again. Do not `read` and `more` the same path and query: they keep their answer at the same place.
- A read or a write resolves with an `ApiResponse` (a read cancelled by a write rejects). When the backend fails it is the backend's (`success: false`, `message`); an answer that is not JSON becomes `{ success: false, message: 'Request failed', result: <the text> }`, and no answer `{ success: false, message: 'Request failed' }`.
- Each failed request adds its `ApiResponse` to the store's `/error/list` as an `ApiError`, with `message` set to `'Request failed'` when the backend brings none and `timestamp` (`Date.now()`) of when it failed. The views get it with `get('/error/list')`, or through the `error` component of `@nano-app/components`.
- On the server (the first HTML that Next renders) `read` asks nothing and resolves with an empty `ApiResponse` (`{}`).
- `/busy` is `true` while a request of the store is out (`backend.get('/busy') ? 'Loading…' : …`).
- What another user changes is seen after a write on the same path.

To ask only when the user stops typing, keep the text in the `app` store and read after a pause:

```ts
let oTimer: ReturnType<typeof setTimeout>;
export default createController(({ stores: { app, backend } }) => ({
  type(sText: string): void {
    app.set('/search/text', sText);
    clearTimeout(oTimer);
    oTimer = setTimeout(() => {
      app.set('/search/applied', sText);
      backend.read('/users', { where: { name: { ilike: `%${sText}%` } } });
    }, 300);
  },
}));
// The view gets backend.get('/users', { where: { name: { ilike: `%${app.get('/search/applied')}%` } } })
```

### Pages with a session

A page that needs a session wraps itself with `createPage`, from `@nano-app/frontend/server`. Better Auth in the backend of the store answers the session; without one the page redirects:

```tsx
// app/dashboard/page.tsx
import { createPage } from '@nano-app/frontend/server';

export default createPage({ store: 'api', redirect: '/login' }, ({ session }) => (
  <Dashboard user={session.user} />
));
```

- `store` names the api store whose backend has Better Auth; `redirect` is where the page goes without a session.
- The view gets Next's props and `session`, Better Auth's answer as is (`{ session, user }`).
- It is optional: a page without it is a public page of Next.
- On each render the server asks `GET <API_<STORE>_URL>/auth/get-session` with the browser's cookie, once per render. Turn on Better Auth's cookie cache in the backend (`session: { cookieCache: { enabled: true, maxAge: 300 } }`) so it does not read the database each time.
- The path is `/auth`, Better Auth's `basePath` by default: a backend that moves it breaks the page, as it breaks the `auth` component.
- The page only keeps itself from showing: the data stays protected by the backend.
- `@nano-app/frontend/server` runs on the server only: import it from pages and server components, never from a client component.

### Sessions

With [Better Auth](../backend/README.md#better-auth) on in the backend, its store declares `auth`: `path`, the `basePath` of Better Auth there (`/auth` by default, as the backend's), and `routes`, the pages that need a session. Without it the store stays as is.

```ts
// src/stores/api.store.ts
export default {
  type: 'api',
  auth: {
    routes: [
      { match: '/', redirect: '/login' },
      { match: '/admin/*', roles: 'admin,editor' },
      { match: '/reports', permissions: { collections: 'read,update' } },
    ],
  },
};
```

```ts
// src/controllers/session.controller.ts
export default createController(({ stores: { backend } }) => ({
  signIn(sEmail: string, sPassword: string): Promise<unknown> {
    return backend.post('/sign-in/email', { email: sEmail, password: sPassword });
  },
  signOut(): Promise<unknown> {
    return backend.post('/sign-out');
  },
}));
```

- `post(path, body)` sends `POST <auth.path><path>` to Better Auth: `/sign-in/email`, `/sign-up/email`, `/sign-out`, `/sign-in/social` (`{ provider, callbackURL }`: the browser goes to the provider), `/request-password-reset`, and the endpoints of the plugins the backend has (`/sign-in/username`, `/sign-in/magic-link`).
- It returns Better Auth's answer inside an `ApiResponse`: `{ success, result, message }`, with its `message` when it failed. A failed answer also goes to `/error/list`.
- It runs on [Better Auth's client](https://www.better-auth.com/docs/concepts/client), which only the store uses, through the proxy.
- The store keeps `{ user, session }` at `/session`, or `null` without a session: it reads it when the app starts, and again after a sign-in, a sign-up or a sign-out of any kind, and when the tab gets the focus back, as the client does.
- Any 401 of the store's backend reads the session again.
- The session lives in Better Auth's cookie, which the proxy passes as any other.
- Better Auth checks the `Origin` of every `POST`: add the URL of the frontend to its `trustedOrigins` in the backend.
- With two backends with Better Auth, their cookies get the same name on the frontend's domain: give one of them another `advanced.cookiePrefix`.

### With a proxy of your own

Next takes one `proxy.ts`. To keep yours, call nano-app's from it for `/api`, and include `/api` in your `matcher`:

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import { proxy as nanoProxy } from '@nano-app/frontend/proxy';
import type { NextRequest } from 'next/server';

export function proxy(oReq: NextRequest) {
  if (!oReq.nextUrl.pathname.startsWith('/dashboard/')) return nanoProxy(oReq);

  // Your own logic
  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*', '/dashboard/:path*'] };
```

## Test app

`tests/app` is a Next app that uses the package from the workspace:

```bash
pnpm --filter @nano-app/frontend build
pnpm --filter nano-frontend-test-app build
pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```

The `Users` component reads and writes `/users` of the `backend` store, and `UsersList` pages and sorts it with `list` of [`@nano-app/components`](../components/README.md): point it at any backend that answers `GET`, `QUERY` (`offset`, `limit`, `orderBy`), `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`, and give it the key its store declares:

```bash
API_BACKEND_URL=http://localhost:3000 API_BACKEND_KEY_HEADER=dev pnpm --filter nano-frontend-test-app start
```

The `backend` store declares `auth: { routes: [{ match: '/private/*', redirect: '/login' }] }`: the backend has Better Auth with `emailAndPassword`, and the URL of the app (`http://localhost:3100`) in its `trustedOrigins`. `/login` signs in, `/` shows the session with a button to sign out, and `/private` shows only with a session.

## Design

- The browser never talks to the backend: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin. What the backend exposes and how it is protected is decided in the backend.
- No `glob` or `jiti` in the client bundle, and no generated files in `node_modules`: build data goes through Next's `env`.
- Rejected, not coming back: typed store paths (a store's state changes with the app's flow), `useStore`, `createComponent`, `StoreManager`, controllers as classes, a `set` guard during render, a static (server) mode of the creator.
- Not yet, until real controllers ask for it: `onInit` in the controller, inheritance between controllers, a debounce of the framework, dropping old reads, reading what other users change, `PATCH`, the React Compiler.
