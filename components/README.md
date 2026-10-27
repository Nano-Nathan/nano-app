# @nano-app/components

[![components](https://img.shields.io/npm/v/@nano-app/components?label=components)](https://www.npmjs.com/package/@nano-app/components)

Official components for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend). A component is the logic of a piece of UI, a controller ready to use: you write only the view. One import path per component: `@nano-app/components/<name>`. No markup and no styles.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@nano-app/frontend` 0.6, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/frontend @nano-app/components
```

```tsx
// src/components/Users.tsx
'use client';

import { useEffect } from 'react';
import list from '@nano-app/components/list';

export default list({ path: '/users', top: 20 }).bindView(
  ({ stores: { api }, load, items, next, prev, sort }) => {
    useEffect(() => {
      load();
    }, []);

    return (
      <section>
        <button onClick={() => sort('name')}>name</button>
        <ul>
          {items()?.result?.map(oUser => (
            <li key={oUser.id}>{oUser.name}</li>
          ))}
        </ul>
        <button onClick={prev}>←</button> {(api.get('/list/page') ?? 0) + 1}{' '}
        <button onClick={next}>→</button>
      </section>
    );
  },
);
```

- Each call (`list({ … })`) returns a controller of `@nano-app/frontend`: bind views to it with `bindView`, and change or add methods with `extend(({ props, stores }) => ({ … }))`.
- A component gives its view only methods. Its state lives in its api store, under its name (`/list/page`): the view reads it with `get`, and the requests in progress with the store's `/busy`. Two components of the same kind on the same store share it.
- A component that reads the backend uses the store named in `store`, `api` by default (`src/stores/api.store.ts`). Without it, it renders without data and asks nothing.

## Components

| Component | Import | Options | The view receives |
|---|---|---|---|
| `auth` | `import auth from '@nano-app/components/auth'` | `kind` (default `'email'`), `store` (default `'api'`) | `signIn(body)`, `signUp(body)`, `signOut()`, `load()`, `navTo(url)`; in the store: `/session` |
| `error` | `import error from '@nano-app/components/error'` | — | `items()`, `remove(index)`, `clear()`, `last()`, `dismiss()` |
| `list` | `import list from '@nano-app/components/list'` | `path`, `top`, `store` (default `'api'`) | `load()`, `items()`, `next()`, `prev()`, `sort(field)`; in the store: `/list/page` (from 0, `undefined` until it moves), `/list/orderby` |

`auth()` uses the [sessions](../frontend/README.md#sessions) of an api store that declares `auth`: `signIn(body)` and `signUp(body)` send `body` to Better Auth's method `kind` (`{ email, password }` for `email`), `signOut()` signs out and `load()` reads the session into `/session`. Each one returns the store's `ApiResponse`. `navTo(url)` goes to a url of the app with Next's router; the view decides when. Create the controller once and bind every view to it:

```tsx
// src/controllers/auth.controller.ts
export default auth();

// src/components/Logout.tsx
export default authController.bindView(({ signOut, navTo }) => {
  // Signs out and goes to the login
  const fnSignOut = async () => {
    const oResponse = await signOut();
    if (oResponse?.success) navTo('/login');
  };

  return <button onClick={fnSignOut}>sign out</button>;
});
```

`error()` gathers the `/error/list` of every api store: `items()` gives all the errors (the `ApiResponse` of each failed request with its `timestamp`) from the newest, `remove(index)` removes the one at that index of `items()` from its store and `clear()` empties them all: a panel of errors uses them. `last()` gives the newest one and `dismiss()` removes it: an alert uses them.

`load()` reads the current page of `path` with a `QUERY` (`skip`, `top`, `orderby`) through the store, and `items()` gets the `ApiResponse` it kept; nothing is asked until a method reads. `next`, `prev` and `sort` change the page or the order and read it. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page.

## Layout

```
components/
└── <name>/
    └── index.ts        default-exports the component's factory: the import path
```
