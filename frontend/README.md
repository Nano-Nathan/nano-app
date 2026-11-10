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

`withNanoApp` also adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin` to every page, and hides `X-Powered-By` (`poweredByHeader: false`). Your own `headers()` go after them, so a header with the same name replaces it; set `poweredByHeader: true` to show it again. `Content-Security-Policy` and `Strict-Transport-Security` depend on each app, so add them in your `headers()` (for the policy, see [Next's guide](https://nextjs.org/docs/app/guides/content-security-policy)) or in the proxy that serves HTTPS:

```ts
export default withNanoApp({
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ],
    },
  ],
});
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

A `src/stores/**/*.store.ts` is a store of UI state, named after its path (`src/stores/admin/users.store.ts` → `admin_users`). `withNanoApp` loads them at build time; `NanoAppProvider` gives each React tree its own copy. The `app` store is always there, empty when the app has no `app.store.ts`.

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

`callbacks` (since 0.7), first in that object, is not a method: `onMount` runs once when each bound view mounts (never on the server), to read what the view needs. To act when a value changes, the view calls a method from a `useEffect` with that value as its dependency (see [Sessions](#sessions)); the logic stays in the method.

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

A store of type `api` connects the app to a backend. The browser never talks to the backend: it calls `/api/<store>/...` on the Next server, and the proxy sends the request there.

```ts
// src/stores/backend.store.ts
export default { type: 'api' };
```

```ts
// proxy.ts, next to app/
export { proxy } from '@nano-app/frontend/proxy';
```

The backend URL is read at runtime from `API_<STORE>_URL` (`backend` → `API_BACKEND_URL`, `admin/users.store.ts` → `API_ADMIN_USERS_URL`), on the server only: it never reaches the browser. The prefix goes away (`/api/backend/users/7?top=1` → `$API_BACKEND_URL/users/7?top=1`); a backend with a `basePath` puts it in the URL (`API_BACKEND_URL=http://backend:3000/api`).

- The request keeps its method, headers, cookies and body, and the backend's answer comes back as is, `Set-Cookie` and redirects included.
- Every `/api/<name>/...` goes to `API_<NAME>_URL`, and one without its variable answers 500 with the name of the variable to define. A request outside `/api/<name>` goes on to the app's own routes.

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
- Each path has a version that its writes raise. A read answers from the store while it was kept at the current version of its path; otherwise it asks the backend (`GET`, or `QUERY` with the query as JSON body). An answer that comes back after a write on its path is returned but not kept.
- `create` (`POST <path>`), `update` (`PUT <path>`) and `delete` (`DELETE <path>`) return a promise of the `ApiResponse` and raise the version of their path and its parents (`update('/users/7')` raises `/users/7` and `/users`), so their next reads ask the backend, whatever their query. Other paths keep what they have.
- A successful `update` also keeps its `ApiResponse` at its path, over what the store had there, with the new version of the path: its next read answers from the store. `create` and `delete` keep nothing.
- A read or a write always resolves with an `ApiResponse`. When the backend fails it is the backend's (`success: false`, `message`); an answer that is not JSON becomes `{ success: false, message: 'Request failed', result: <the text> }`, and no answer `{ success: false, message: 'Request failed' }`.
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

### Headers per backend

A backend that asks for a key (`x-api-key`) gets it from the proxy. The store names the header and the variable that holds its value, never the value itself, since store files reach the browser:

```ts
// src/stores/payments.store.ts
export default { type: 'api', headers: { 'x-api-key': 'STRIPE_KEY' } };
```

The proxy sends `x-api-key` with the value of `API_STRIPE_KEY_HEADER` (the name in upper case) on every request to that store; a missing variable answers 500 with its name.

- A store header wins over a browser header with the same name: the browser cannot replace or guess the key.
- The proxy adds the key to every request to that store, from any visitor, with or without a session: anyone who reaches the app can call any path and method of that backend with it. Declare a key only for a backend whose every endpoint may be called by your visitors, and keep the rest protected there.
- The proxy sends every header of the browser to the backend, cookies included: point a store only at a backend you trust with your users' cookies.
- The client IP reaches the backend in `X-Forwarded-For`, which Next fills only when the request brings none. Put a proxy in front of Next that appends the client IP (nginx, a load balancer, Tailscale Funnel): with Next exposed directly, a browser that sends its own header chooses the IP it is counted by. See [Client IP](../backend/README.md#client-ip).
- The user's own credentials (the session cookie, `Authorization`) still go as the browser sends them. Do not declare a header the user needs in the store, or every user goes with the store's value.
- Without a `matcher`, Next runs the proxy on every request; to skip the rest, add `export const config = { matcher: ['/api/:path*', ...] };` to `proxy.ts` with `/api` and the pages of `auth.routes` (Next reads it only when it is written there).

### Sessions

With [Better Auth](../backend/README.md#better-auth) on in the backend, its store declares `auth`: `path`, the `basePath` of Better Auth there, and `routes`, the pages that need a session. Without it the store stays as is.

```ts
// src/stores/backend.store.ts
export default {
  type: 'api',
  auth: {
    path: '/api/auth',
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
  load(): Promise<unknown> {
    return backend.readSession();
  },
  signIn(sEmail: string, sPassword: string): Promise<unknown> {
    return backend.signIn('email', { email: sEmail, password: sPassword });
  },
  signOut(): Promise<unknown> {
    return backend.signOut();
  },
}));
```

- `signIn(kind, body)` and `signUp(kind, body)` send `POST <path>/sign-in/<kind>` and `POST <path>/sign-up/<kind>`: `kind` is the method of Better Auth (`email`, ...), and `body` what it asks. `signOut()` sends `POST <path>/sign-out`.
- They return Better Auth's answer inside an `ApiResponse`: `{ success, result, message }`, with `success` when the backend answered 2xx and its `message` when it failed.
- `readSession()` asks `GET <path>/get-session` and keeps `{ user, session }` at `/session`, or `null` without a session. It answers from the store until a `signIn`, `signUp` or `signOut` succeeds, which reads it again. On the server it asks nothing and resolves with `{}`.
- Any 401 of the store's backend sets `/session` to `null`, and the next `readSession()` asks again.
- The session lives in Better Auth's cookie, which the proxy passes as any other: a refresh reads it again with `readSession()`.
- Better Auth checks the `Origin` of every `POST`: add the URL of the frontend to its `trustedOrigins` in the backend.
- With two backends with Better Auth, their cookies get the same name on the frontend's domain: give one of them another `advanced.cookiePrefix`.

#### Guarded pages

The proxy guards the pages of `auth.routes`; every other page is public. For each page it takes the first route that matches, across the stores with `auth`, and lets it through or redirects it:

- `match`: the path of the page, exact (`/admin`) or it and every path below it (`/admin/*`).
- `redirect`: where the page goes when the request is not allowed, `/` by default. A route whose `match` covers its own `redirect` is invalid.
- Without `roles` nor `permissions`, the page needs a session: the proxy asks `GET <path>/get-session` with the browser's cookie.
- `roles`: roles of Better Auth's admin plugin, separated by commas. Any role of the user (`user.role` of the session, also separated by commas) allows it.
- `permissions`: actions per resource of the admin plugin, separated by commas. The proxy asks `POST <path>/admin/has-permission` with them as `{ permissions: { collections: ['read', 'update'] } }`, and every one is needed. A route with `roles` and `permissions` needs both.
- `roles` and `permissions` need the admin plugin on in the backend. Their names are not checked against it: a role or an action it does not have never allows the page.
- Every request of a guarded page asks `get-session` through the proxy, and `has-permission` too when the route has `permissions`. A session that ends while a page is open is caught on the next navigation.
- To answer `get-session` without reading the database, turn on Better Auth's cookie cache in the backend's `src/auth.ts` (`session: { cookieCache: { enabled: true, maxAge: 300 } }`): the session comes from a signed cookie, so a revoked session or a new role shows up within `maxAge` seconds. `has-permission` always reads the database.

The data stays protected by the backend: the proxy only keeps the pages from showing.

### With a proxy of your own

Next takes one `proxy.ts`. To keep yours, call nano-app's from it for `/api` and the pages of `auth.routes`, and include them in your `matcher`:

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

export const config = { matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*'] };
```

## Test app

`tests/app` is a Next app that uses the package from the workspace:

```bash
pnpm --filter @nano-app/frontend build
pnpm --filter nano-frontend-test-app build
pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```

The `Users` component reads and writes `/users` of the `backend` store, and `UsersList` pages and sorts it with `list` of [`@nano-app/components`](../components/README.md): point it at any backend that answers `GET`, `QUERY` (`skip`, `top`, `orderby`), `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`, and give it the key its store declares:

```bash
API_BACKEND_URL=http://localhost:3000 API_BACKEND_KEY_HEADER=dev pnpm --filter nano-frontend-test-app start
```

The `backend` store declares `auth: { path: '/api/auth', routes: [{ match: '/private/*', redirect: '/login' }] }`: the backend has Better Auth with `emailAndPassword`, and the URL of the app (`http://localhost:3100`) in its `trustedOrigins`. `/login` signs in, `/` shows the session with a button to sign out, and `/private` shows only with a session.

## Design

- The browser never talks to the backend: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin. What the backend exposes and how it is protected is decided in the backend.
- No `glob` or `jiti` in the client bundle, and no generated files in `node_modules`: build data goes through Next's `env`.
- Rejected, not coming back: typed store paths (a store's state changes with the app's flow), `useStore`, `createComponent`, `StoreManager`, controllers as classes, a `set` guard during render, a static (server) mode of the creator.
- Not yet, until real controllers ask for it: `onInit`/`onExit` in the controller, inheritance between controllers, a debounce of the framework, dropping old reads, reading what other users change, `PATCH`, the React Compiler.
