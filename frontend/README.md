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

`withNanoApp` also writes `nano-app-env.d.ts` next to `next.config.ts`, with the type of each store (`stores.ui` is a `Store`, `stores.api` an `ApiStore`). Add it to `.gitignore`, as `next-env.d.ts`; the `**/*.ts` of Next's `tsconfig.json` already includes it.

## Controllers and views

A controller is a class that holds the logic of a view: it extends `Controller` and reaches the view's `props`, the app's `stores` and Next's `router` with `this`. `createView` creates the component: it renders the view with its own instance of the controller.

```ts
// src/controllers/counter.controller.ts
import { Controller } from '@nano-app/frontend';

export default class CounterController extends Controller {
  increment(): void {
    const { app } = this.stores;
    app.set('/iCount', app.get('/iCount') + 1);
  }
}
```

```tsx
// src/components/Counter.tsx
'use client';

import { createView } from '@nano-app/frontend';
import CounterController from '../controllers/counter.controller';

export default createView(CounterController, (counter, props) => (
  <button onClick={counter.increment}>{counter.stores.app.get('/iCount')}</button>
));
```

- A file that calls `createView` needs `'use client'`. A component without stores or methods is a plain React function and can stay a server component.
- The view gets the controller and the props of this render. It re-renders only when a store path it read changes.
- A view that only reads the stores takes the base class: `createView(Controller, view => …)`.
- Each mount of a view has its own controller; several views can share one controller class, and they share the stores.
- Every method is bound once per mount: the view can pass one alone (`onClick={counter.increment}`), and it stays the same function while the view is mounted, so a child that gets it does not render again for it. A method with its own arguments goes through an arrow (`onClick={() => counter.update(-5)}`): passed alone, it would get React's event as its first argument.
- `this.props` are the props of the last render on screen, so a method sees them when it runs from an event or an effect. What the view shows reads the `props` it gets.
- A field of the class can read the context: fields are set after the base constructor (`oApi = this.stores.backend;`).
- A store the app does not have (`this.stores.missing`) is a type error: `withNanoApp` writes the type of each one (see [Stores](#stores)).

`onMount` runs once when the view mounts (never on the server), to read what the view needs, and `onUnmount` once when it unmounts. To act when a value changes, the view calls a method from a `useEffect` with that value as its dependency; the logic stays in the method.

```ts
export default class UsersController extends Controller {
  onMount(): Promise<unknown> {
    return this.load();
  }
  load(): Promise<unknown> {
    return this.stores.backend.GET('/users');
  }
}
```

A controller extends another as any class: a method with the same name replaces the original, and reaches it with `super` (`super.onMount()` keeps the original's `onMount`).

```ts
export default class ResetCounterController extends CounterController {
  reset(): void {
    this.stores.app.set('/iCount', 0);
  }
}
```

The types come from `@nano-app/frontend`: `Controller`, `View` and `ComponentProps`; the stores' types are `Stores`, `Store` and `ApiStore`.

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

Each api store is served on `/api/<store>`, with its backend URL in `API_<STORE>_URL` (`api.store.ts` → `/api/api/...` and `API_API_URL`, `admin/users.store.ts` → `/api/admin_users/...` and `API_ADMIN_USERS_URL`; `/api/api/users/7?top=1` → `$API_API_URL/users/7?top=1`). The URLs are read at runtime, once, on the server only: they never reach the browser. A backend with a `basePath` puts it in the URL (`API_API_URL=http://backend:3000/api`).

- The request keeps its method, headers, cookies and body, and the backend's answer comes back as is, `Set-Cookie` and redirects included.
- The proxy sends every header of the browser to the backend, cookies included: point a store only at a backend you trust with your users' cookies.
- The client IP reaches the backend in `X-Forwarded-For`, which Next fills only when the request brings none. Put a proxy in front of Next that appends the client IP (nginx, a load balancer, Tailscale Funnel): with Next exposed directly, a browser that sends its own header chooses the IP it is counted by. See [Client IP](../backend/README.md#client-ip).
- The `matcher` keeps Next from running the proxy on every other request (pages, `_next/static`, images). Next reads it only when it is written in the app's `proxy.ts`: re-exported from the package, it is ignored. Without it the proxy still works, letting every other request go on. Keep it on `/api`, the path of the proxy.
- While an api store has no URL, every `/api/` request answers 500 with the variables to define. `/api/<name>` of no api store, and any request outside `/api/`, goes on to the app's own routes.

### Reading and writing

An `api` store reads and writes its backend with one method per HTTP method. The controllers call them; the views get what a read kept. It also has its own state like any store (`get`, `set`, and `data` in its file): UI state about that backend (a page, an order) can live next to it.

```ts
// src/controllers/users.controller.ts
export default class UsersController extends Controller {
  onMount(): Promise<unknown> {
    return this.load();
  }
  load(): Promise<unknown> {
    return this.stores.backend.QUERY('/users', { limit: 20 });
  }
  async add(sName: string): Promise<unknown> {
    await this.stores.backend.POST('/users', { name: sName });
    return this.load();
  }
}
```

```tsx
// src/components/Users.tsx
export default createView(UsersController, users => (
  <ul onClick={() => users.add('Bruno')}>
    {(users.stores.backend.get('/users', { limit: 20 })?.result ?? []).map(oUser => (
      <li key={oUser.id}>{oUser.name}</li>
    ))}
  </ul>
));
```

- `GET(path)` and `QUERY(path, query)` (the query as JSON body) return a promise of the `ApiResponse` and keep it in the store at their path and query, over what the store had there: a field the new answer does not bring stays from the last one. The view gets it with `get(path, query?)`, and renders again when a read keeps a new one.
- `POST(path, body)`, `PUT(path, body)` and `DELETE(path)` return a promise of the `ApiResponse` and keep nothing: read again after a write.
- Each answer is an `ApiResponse` with the HTTP `status`. When the backend fails it is the backend's (`success: false`, `message`); an answer that is not JSON becomes `{ success: false, message: 'Request failed', result: <the text> }`, and no answer `{ success: false, message: 'Request failed' }`.
- Each failed request adds its `ApiResponse` to the store's `/error/list` as an `ApiError`, with `message` set to `'Request failed'` when the backend brings none and `timestamp` (`Date.now()`) of when it failed. The views get it with `get('/error/list')`, or through the `error` component of `@nano-app/components`.
- `/busy` is `true` while a request of the store is out (`backend.get('/busy') ? 'Loading…' : …`).
- On the server (the first HTML that Next renders) a request asks nothing and resolves with an empty `ApiResponse` (`{}`).

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
API_BACKEND_URL=http://localhost:3000 pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```

The `Users` component reads and writes `/users` of the `backend` store, and `UsersList` pages and sorts it with `list` of [`@nano-app/components`](../components/README.md): point it at any backend that answers `GET`, `QUERY` (`offset`, `limit`, `orderBy`), `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`. `/private` is a page with a session: the backend has Better Auth with `emailAndPassword`, and the URL of the app (`http://localhost:3100`) in its `trustedOrigins`.

## Design

- The browser never talks to the backend: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and does not depend on any backend plugin. What the backend exposes and how it is protected is decided in the backend.
- No `glob` or `jiti` in the client bundle, and no generated files in `node_modules`: build data goes through Next's `compiler.define`, and the stores' types through `nano-app-env.d.ts` in the app.
- Rejected, not coming back: typed store paths (a store's state changes with the app's flow), `useStore`, `createComponent`, `StoreManager`, a `set` guard during render, a static (server) mode of the creator.
- Not yet, until real controllers ask for it: `onInit` in the controller, a debounce of the framework, dropping old reads, reading what other users change, `PATCH`, the React Compiler.
