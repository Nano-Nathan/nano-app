# @nano-app/frontend

Frontend of [nano-app](https://github.com/Nano-Nathan/nano-app) for Next.js apps: UI state in stores, and controllers whose methods the views use. Work in progress.

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

`extend` returns a new controller with your methods merged over its own: a method with the same name replaces the original, the others stay, and the original controller does not change. It receives only an object of methods: a replaced method does not reach the original one.

```ts
export default counterController.extend({ log: (sText: string) => console.info(sText) });
```

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

An `api` store has no `get` or `set`: it reads and writes its backend, and keeps what it read.

```ts
// src/controllers/users.controller.ts
export default createController(({ stores: { backend } }) => ({
  add: (sName: string) => backend.create('/users', { name: sName }),
  rename: (iId: number, sName: string) => backend.update(`/users/${iId}`, { name: sName }),
  remove: (iId: number) => backend.delete(`/users/${iId}`),
}));
```

```tsx
// src/components/Users.tsx
export default usersController.bindView(({ stores: { backend }, rename }) => (
  <ul>
    {(backend.read('/users') ?? []).map(oUser => (
      <li key={oUser.id} onClick={() => rename(oUser.id, 'Bruno')}>{oUser.name}</li>
    ))}
  </ul>
));
```

- `read(path, query?)` returns the `result` it keeps for that path and query, `undefined` until it arrives. It works in the render: the first read, or a read after its entity changed, asks the backend (`GET`, or `QUERY` with the query as JSON body), and the view renders again when the answer comes. Each path and query is asked once per change of its entity.
- The entity is the first segment of the path (`/users/7` → `/users`). `create` (`POST <path>`), `update` (`PUT <path>`) and `delete` (`DELETE <path>`) return the `ApiResponse`, and when it comes back every read of the entity asks again the next time it renders, whatever its query. Other entities keep what they have.
- On the server (the first HTML that Next renders) `read` asks nothing and returns `undefined`: the browser asks when it hydrates.
- `busy` counts the requests in progress (`backend.busy ? 'Loading…' : …`).
- A read keeps the `result` of its answer, `undefined` when it failed, and is not asked again until a write on its entity. A request that fails (no answer, or not JSON) rejects: the errors module will show it.
- What another user changes is seen after a write on the same entity.
- Every path and query read stays kept while the page is open.

To ask only when the user stops typing, keep the text in the `app` store and copy it to the query after a pause:

```ts
let oTimer: ReturnType<typeof setTimeout>;
export default createController(({ stores: { app } }) => ({
  type: (sText: string) => {
    app.set('/search/text', sText);
    clearTimeout(oTimer);
    oTimer = setTimeout(() => app.set('/search/applied', sText), 300);
  },
}));
// The view reads backend.read('/users', { filter: { name: { contains: app.get('/search/applied') } } })
```

### Headers per backend

A backend that asks for a key (`x-api-key`) gets it from the proxy. The store names the header and the variable that holds its value, never the value itself, since store files reach the browser:

```ts
// src/stores/payments.store.ts
export default { type: 'api', headers: { 'x-api-key': 'STRIPE_KEY' } };
```

The proxy sends `x-api-key` with the value of `API_STRIPE_KEY_HEADER` (the name in upper case) on every request to that store; a missing variable answers 500 with its name.

- A store header wins over a browser header with the same name: the browser cannot replace or guess the key.
- The user's own credentials (the session cookie, `Authorization`) still go as the browser sends them. Do not declare a header the user needs in the store, or every user goes with the store's value.
- Without a `matcher`, Next runs the proxy on every request; to skip the rest, add `export const config = { matcher: '/api/:path*' };` to `proxy.ts` (Next reads it only when it is written there).

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

The `Users` component reads and writes `/users` of the `backend` store: point it at any backend that answers `GET`, `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`, and give it the key its store declares:

```bash
API_BACKEND_URL=http://localhost:3000 API_BACKEND_KEY_HEADER=dev pnpm --filter nano-frontend-test-app start
```
