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

A `src/stores/**/*.store.ts` is a store of UI state, named after its path (`src/stores/admin/users.store.ts` → `admin_users`). `withNanoApp` loads them at build time; `NanoAppProvider` gives each React tree its own copy. The `app` store is always there, empty when the app has no `app.store.ts`.

```ts
// src/stores/ui.store.ts
export default { type: 'app', data: { isOpen: false } };
```

Each store reads and writes by path: `app.get('/drawer/isOpen')`, `app.set('/drawer/isOpen', true)`. A missing level reads as `undefined`, and `set` creates it.

## Controllers and views

A controller holds the methods; a view binds to one controller and gets its methods, the props and the stores. Several views can bind to the same controller.

```ts
// src/controllers/counter.controller.ts
import { createController } from '@nano-app/frontend';

export default createController(({ props, stores: { app } }) => ({
  increment: () => app.set('/iCount', app.get('/iCount') + 1),
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
- A method named `props` or `stores` is hidden by the context of the same name.

`extend` returns a new controller with your methods merged over its own: a method with the same name replaces the original, the others stay, and the original controller does not change. Its methods receive the same context (`props`, `stores`) as the controller's.

```ts
export default counterController.extend(({ stores: { app } }) => ({
  reset: () => app.set('/iCount', 0),
}));
```

The types of a controller and its views come from `@nano-app/frontend`: `Controller`, `View`, `ComponentContext` (`props` and `stores`) and `ComponentProps`.

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
  load: () => backend.read('/users'),
  add: async (sName: string) => {
    await backend.create('/users', { name: sName });
    return backend.read('/users');
  },
}));
```

```tsx
// src/components/Users.tsx
export default usersController.bindView(({ stores: { backend }, load, add }) => {
  useEffect(() => {
    load();
  }, []);

  return (
    <ul onClick={() => add('Bruno')}>
      {(backend.get('/users')?.result ?? []).map(oUser => (
        <li key={oUser.id}>{oUser.name}</li>
      ))}
    </ul>
  );
});
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
  type: (sText: string) => {
    app.set('/search/text', sText);
    clearTimeout(oTimer);
    oTimer = setTimeout(() => {
      app.set('/search/applied', sText);
      backend.read('/users', { filter: { name: { contains: sText } } });
    }, 300);
  },
}));
// The view gets backend.get('/users', { filter: { name: { contains: app.get('/search/applied') } } })
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
- The user's own credentials (the session cookie, `Authorization`) still go as the browser sends them. Do not declare a header the user needs in the store, or every user goes with the store's value.
- Without a `matcher`, Next runs the proxy on every request; to skip the rest, add `export const config = { matcher: '/api/:path*' };` to `proxy.ts` (Next reads it only when it is written there).

### Sessions

With [Better Auth](../backend/README.md#better-auth) on in the backend, its store declares `auth`, the `basePath` of Better Auth there. Without it the store stays as is.

```ts
// src/stores/backend.store.ts
export default { type: 'api', auth: '/api/auth' };
```

```ts
// src/controllers/session.controller.ts
export default createController(({ stores: { backend } }) => ({
  load: () => backend.readSession(),
  signIn: (sEmail: string, sPassword: string) =>
    backend.signIn('email', { email: sEmail, password: sPassword }),
  signOut: () => backend.signOut(),
}));
```

- `signIn(kind, body)` and `signUp(kind, body)` send `POST <auth>/sign-in/<kind>` and `POST <auth>/sign-up/<kind>`: `kind` is the method of Better Auth (`email`, ...), and `body` what it asks. `signOut()` sends `POST <auth>/sign-out`.
- They return Better Auth's answer inside an `ApiResponse`: `{ success, result, message }`, with `success` when the backend answered 2xx and its `message` when it failed.
- `readSession()` asks `GET <auth>/get-session` and keeps `{ user, session }` at `/session`, or `null` without a session. It answers from the store until a `signIn`, `signUp` or `signOut` succeeds, which reads it again. On the server it asks nothing and resolves with `{}`.
- Any 401 of the store's backend sets `/session` to `null`, and the next `readSession()` asks again.
- The session lives in Better Auth's cookie, which the proxy passes as any other: a refresh reads it again with `readSession()`.
- Better Auth checks the `Origin` of every `POST`: add the URL of the frontend to its `trustedOrigins` in the backend.
- With two backends with Better Auth, their cookies get the same name on the frontend's domain: give one of them another `advanced.cookiePrefix`.

A page that needs a session gets a layout bound to the session controller: it renders nothing until the session is read, and goes to the login without one, also after a 401.

```tsx
// src/components/Private.tsx
'use client';

export default sessionController.bindView(({ props, stores: { backend }, load }) => {
  const oRouter = useRouter();
  const oSession = backend.get('/session');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (oSession === null) oRouter.replace('/login');
  }, [oSession]);

  return oSession ? props.children : null;
});
// app/private/layout.tsx renders <Private>{children}</Private>
```

The data stays protected by the backend: the layout only keeps the page from showing.

### With a proxy of your own

Next takes one `proxy.ts`. To keep yours, call nano-app's from it for `/api` and include `/api/:path*` in your `matcher`:

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import { proxy as nanoProxy } from '@nano-app/frontend/proxy';
import type { NextRequest } from 'next/server';

export function proxy(oReq: NextRequest) {
  if (oReq.nextUrl.pathname.startsWith('/api/')) return nanoProxy(oReq);

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

The `Users` component reads and writes `/users` of the `backend` store, and `UsersList` pages and sorts it with `list` of [`@nano-app/components`](../components/README.md): point it at any backend that answers `GET`, `QUERY` (`skip`, `top`, `orderby`), `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`, and give it the key its store declares:

```bash
API_BACKEND_URL=http://localhost:3000 API_BACKEND_KEY_HEADER=dev pnpm --filter nano-frontend-test-app start
```

The `backend` store declares `auth: '/api/auth'`: the backend has Better Auth with `emailAndPassword`, and the URL of the app (`http://localhost:3100`) in its `trustedOrigins`. `/login` signs in, `/` shows the session with a button to sign out, and `/private` shows only with a session.

## Design

- The browser never talks to the backend: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin. What the backend exposes and how it is protected is decided in the backend.
- No `glob` or `jiti` in the client bundle, and no generated files in `node_modules`: build data goes through Next's `env`.
- Rejected, not coming back: `useStore`, `createComponent`, `StoreManager`, controllers as classes, a `set` guard during render, a static (server) mode of the creator.
- Not yet, until real controllers ask for it: `onInit`/`onExit` in the controller, inheritance between controllers, a debounce of the framework, dropping old reads, reading what other users change, `PATCH`, the React Compiler.
