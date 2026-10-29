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
- A component gives its view only methods. Its state lives in its api store, under its name (`/list/page`): the view reads it with `get`, and the requests in progress with the store's `/busy`. Two components of the same kind on the same store share it. `form` and `field` keep theirs in the `app` store, under the form's name.
- A component that reads the backend uses the store named in `store`, `api` by default (`src/stores/api.store.ts`). Without it, it renders without data and asks nothing.

## Components

| Component | Import | Options | The view receives |
|---|---|---|---|
| `auth` | `import auth from '@nano-app/components/auth'` | `kind` (default `'email'`), `store` (default `'api'`) | `signIn(body)`, `signUp(body)`, `signOut()`, `load()`, `navTo(url)`; in the store: `/session` |
| `field` | `import field from '@nano-app/components/field'` | — | `value()`, `error()`, `change(value)`; props `form`, `field`, given by the form |
| `form` | `import form from '@nano-app/components/form'` | `components`, `messages` | `fields()`, `submit(event)`, `reset()`; props `name`, `fields`, `onSubmit`; in `app`: `/form/<name>/values`, `/form/<name>/errors` |
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

`form()` builds a form from a config of fields. Write one view per field type with `field()`, give them to one `form()` in `components`, and bind one view of the form: every form is then a config, `<Form name="event" fields={EVENT_FIELDS} onSubmit={…} />`.

```tsx
// src/components/Input.tsx: a field, an input of the field's type with its error
export default field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    {oField.label}
    <input type={oField.type} value={value() ?? ''} onChange={oEvent => change(oEvent.target.value)} />
    <small>{error()}</small>
  </label>
));

// src/controllers/form.controller.ts: once in the app
export default form({ components: { text: Input, checkbox: Checkbox, date: DatePicker } });

// src/components/Form.tsx
export default formController.bindView(({ fields, submit }) => (
  <form onSubmit={submit}>
    {fields()}
    <button>send</button>
  </form>
));

// A form: only its config
const EVENT_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'email', label: 'Contact', type: 'email', required: true },
  { name: 'start', label: 'From', type: 'date', required: true },
  { name: 'end', label: 'To', type: 'date', validate: (sEnd, oValues) => (sEnd < oValues.start ? 'Ends before it starts' : undefined) },
  { name: 'isPublic', label: 'Public', type: 'checkbox' },
];
```

- A field is `{ name, type, required, validate }`; its other keys (`label`, `options`, a `path` to read the options of a select) pass as is to its view. `type` picks the view of `components`, the one of `text` when it has none; without both, rendering the form fails with the field's name.
- `fields()` gives the views of the fields in the order of the config, with the props `form` (the form's name), `field` (its config) and `messages`.
- `change(value)` keeps the value at `/form/<name>/values/<field>` as the view gives it (a text, a `Date`, a boolean) and validates the field. `submit(event)` stops the browser's submit, validates every field and calls `onSubmit(values)` only when none breaks a rule. `reset()` empties the values and errors.
- Default rules, in order: `required` (a value missing or `''`: only whether the user must give one), then `type` `email` and `number` when there is a value, then the field's `validate(value, values)`, which returns the message or `undefined`. `messages: { required, email, number }` replaces the default messages (`Required`, `Invalid email`, `Invalid number`) for every form of the controller.
- The browser validates native inputs (`type="email"`, `required`) before `submit` and shows its own bubbles. To show only the form's messages, with the app's style, put `noValidate` on the `<form>` of the view.
- The form keeps only values: the errors of the backend after `onSubmit` are shown with `error`, and what comes next (`navTo`, `reset`) is up to `onSubmit`.

`error()` gathers the `/error/list` of every api store: `items()` gives all the errors (the `ApiResponse` of each failed request with its `timestamp`) from the newest, `remove(index)` removes the one at that index of `items()` from its store and `clear()` empties them all: a panel of errors uses them. `last()` gives the newest one and `dismiss()` removes it: an alert uses them.

`load()` reads the current page of `path` with a `QUERY` (`skip`, `top`, `orderby`) through the store, and `items()` gets the `ApiResponse` it kept; nothing is asked until a method reads. `next`, `prev` and `sort` change the page or the order and read it. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page.

## Layout

```
components/
└── <name>/
    └── index.ts        default-exports the component's factory: the import path
```
