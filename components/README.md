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

import list from '@nano-app/components/list';

export default list({ path: '/users', top: 20 }).bindView(
  ({ stores: { api }, items, next, prev, sort }) => (
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
  ),
);
```

- Every component is a function, also without options (`error()`): its options configure the logic once and are shared by every view bound to it, and the props of a view carry the data of each use.
- Each call (`list({ … })`) returns a controller of `@nano-app/frontend`: bind views to it with `bindView`, and change or add methods with `extend(({ props, stores }) => ({ … }))`.
- A component reads what it needs when its view mounts (`callbacks.onMount`): the view only renders.
- A component gives its view only methods. Its state lives in its api store, under its name (`/list/page`): the view reads it with `get`, and the requests in progress with the store's `/busy`. Two components of the same kind on the same store share it. `field` keeps its own in the `app` store, under the name of its form.
- A component that reads the backend uses the store named in `store`, `api` by default (`src/stores/api.store.ts`). Without it, it renders without data and asks nothing.

## Components

| Component | Import | Options | The view receives |
|---|---|---|---|
| `auth` | `import auth from '@nano-app/components/auth'` | `kind` (default `'email'`), `store` (default `'api'`) | `signIn(body)`, `signUp(body)`, `signOut()`, `load()`, `navTo(url)`; in the store: `/session` |
| `field` | `import field from '@nano-app/components/field'` | — | `value()`, `error()`, `change(value)`, `options()`, `parse(input)`, `validate(values)`; props `form`, `field`; in `app`: `/form/<form>/values`, `/form/<form>/errors` |
| `error` | `import error from '@nano-app/components/error'` | — | `items()`, `remove(index)`, `clear()`, `last()`, `dismiss()` |
| `list` | `import list from '@nano-app/components/list'` | `path`, `top`, `store` (default `'api'`) | `load()`, `items()`, `page()`, `query()`, `goTo(page)`, `next()`, `prev()`, `sort(field)`; in the store: `/list/page` (from 0, `undefined` until it moves), `/list/orderby` |

`auth()` uses the [sessions](../frontend/README.md#sessions) of an api store that declares `auth`: `signIn(body)` and `signUp(body)` send `body` to Better Auth's method `kind` (`{ email, password }` for `email`), `signOut()` signs out and `load()` reads the session into `/session`, which the controller also does when its view mounts. Each one returns the store's `ApiResponse`. `navTo(url)` goes to a url of the app with the `router` of the context; the view decides when. Create the controller once and bind every view to it:

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

`field` is the controller of a field view: bind one view per kind of input (a text, a select, a date picker) and give it the props `form` (the name of its form) and `field` (its config).

```tsx
// src/components/Input.tsx: an input of the field's type with its error
export default field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    {oField.label}
    <input
      type={oField.type ?? 'text'}
      disabled={oField.disabled}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <small>{error()}</small>
  </label>
));

<Input form="signUp" field={{ name: 'email', label: 'Email', type: 'email', required: true }} />
```

- A field is `{ name, type, required, errorMessage, validate, format, parse, options }`; its other keys (`label`, `disabled`) pass as is to its view.
- `change(value)` keeps the value at `/form/<form>/values/<name>` as the view gives it (a text, a boolean, the ISO day of a date input), a `number` field as a number when its text is that number as is (`'12'`, while `'1.'` stays a text), and validates the field: `required` (a value missing or `''`), then `type` `email` and `number` when there is a value, then the field's `validate(value, values)`, which receives the values of its form and returns the message or `undefined`. `error()` gives the message of the first rule it breaks.
- `parse(input)` replaces what `change` keeps, and `format(value)` what `value()` gives: a price kept as `1234` and shown as `$1.234`.
- A select takes `options: { path, store }` (`store` is `'api'` by default): the field reads `path` from the backend when its view mounts, and `options()` gives its items as the backend gave them, for the view to take the keys it shows.
- The default rules answer `Required`, `Invalid email` or `Invalid number`; `errorMessage` replaces them for that field.
- The browser validates native inputs (`type="email"`, `required`) and shows its own bubbles. To show only the field's messages, put `noValidate` on the `<form>` of the view.

`error()` gathers the `/error/list` of every api store: `items()` gives all the errors (the `ApiResponse` of each failed request with its `timestamp`) from the newest, `remove(index)` removes the one at that index of `items()` from its store and `clear()` empties them all: a panel of errors uses them. `last()` gives the newest one and `dismiss()` removes it: an alert uses them.

`load()` reads the current page of `path` with a `QUERY` (`skip`, `top`, `orderby`) through the store, and `items()` gets the `ApiResponse` it kept. The list reads its current page when its view mounts. `next`, `prev` and `sort` change the page or the order and read it. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page. `page()` gives the current page (from 0), `query()` the query it reads, and `goTo(page)` moves to a page and reads it.

## Layout

```
components/
└── <name>/
    └── index.ts        default-exports the component's factory: the import path
```
