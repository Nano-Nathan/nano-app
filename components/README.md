# @nano-app/components

[![components](https://img.shields.io/npm/v/@nano-app/components?label=components)](https://www.npmjs.com/package/@nano-app/components)

Official components for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend). A component is the logic of a piece of UI, a controller ready to use: you write only the view. One import path per component: `@nano-app/components/<name>`. No markup and no styles.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@nano-app/frontend` 0.7, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/frontend @nano-app/components
```

```tsx
// src/components/Users.tsx
'use client';

import list from '@nano-app/components/list';

export default list({ path: '/users', limit: 20 }).bindView(
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
- A component that reads the backend uses the store named in `store`, `api` by default (`src/stores/api.store.ts`). Without it, the render throws naming the store file to add.

## Components

| Component | Import                                           | Options                                               | The view receives                                                                                                                                                                                                |
| --------- | ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`    | `import auth from '@nano-app/components/auth'`   | `kind` (default `'email'`), `store` (default `'api'`) | `signIn(body)`, `signUp(body)`, `signOut()`, `load()`, `navTo(url)`; in the store: `/session`                                                                                                                    |
| `field`   | `import field from '@nano-app/components/field'` | —                                                     | `value()`, `error()`, `change(value)`, `options()`, `parse(input)`, `validate(values)`; props `form`, `field`; in `app`: `/form/<form>/values`, `/form/<form>/errors`                                            |
| `form`    | `import form from '@nano-app/components/form'`   | `components`                                          | `fields()`, `submit(event)`, `reset()`; props `name`, `fields`, `onSubmit`; in `app`: `/form/<name>`                                                                                                             |
| `error`   | `import error from '@nano-app/components/error'` | —                                                     | `items()`, `remove(index)`, `clear()`, `last()`, `dismiss()`                                                                                                                                                     |
| `list`    | `import list from '@nano-app/components/list'`   | `path`, `limit`, `store` (default `'api'`)            | `load()`, `items()`, `page()`, `query()`, `goTo(page)`, `next()`, `prev()`, `sort(field)`, `more()`, `pages()`, `pagesQuery()`; in the store: `/list/page` (from 0, `undefined` until it moves), `/list/orderBy` |

`auth()` uses the [sessions](../frontend/README.md#sessions) of an api store that declares `auth`: `signIn(body)` and `signUp(body)` send `body` to Better Auth's method `kind` (`{ email, password }` for `email`), `signOut()` signs out and `load()` reads the session into `/session`, which the controller also does when its view mounts. Each one returns the store's `ApiResponse`. `navTo(url)` goes to a url of the app with the `router` of the context; the view decides when. Create the controller once and bind every view to it:

```tsx
// src/controllers/auth.controller.ts
export default auth();

// src/components/Logout.tsx
export default authController
  .extend(() => ({
    async logout(): Promise<void> {
      // Signs out and goes to the login
      const oResponse = await this.signOut();
      if (oResponse?.success) this.navTo('/login');
    },
  }))
  .bindView(({ logout }) => <button onClick={logout}>sign out</button>);
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

<Input form="signUp" field={{ name: 'email', label: 'Email', type: 'email', required: true }} />;
```

- A field is `{ name, type, required, errorMessage, rules, validate, format, parse, options }`; its other keys (`label`, `disabled`) pass as is to its view.
- `change(value)` keeps the value at `/form/<form>/values/<name>` as the view gives it (a text, a boolean, the ISO day of a date input), a `number` field as a number when its text is that number as is (`'12'`, while `'1.'` stays a text), and validates it with its own rules. `error()` gives the message of the first rule it breaks, and `validate(values)` that message for the values of its form.
- Its rules are a [zod](https://zod.dev) schema the field builds from its config: `type` names the zod type (`email`, `number`, `url`, `uuid`, `boolean`; `checkbox` is a boolean, `date` an ISO day, any other type a text), `required` breaks on a value missing or `''` (without it, an empty value passes), `rules` calls the zod methods of that type by name with their value, or their arguments in an array (`rules: { min: [3, 'Too short'], max: 20 }`; rules only check, they never change the value kept: `parse` does), and `validate(value, values)` runs last with the values of the form and returns the message or `undefined`.
- `parse(input)` replaces what `change` keeps, and `format(value)` what `value()` gives: a price kept as `1234` and shown as `$1.234`.
- A select takes `options: { path, store }` (`store` is `'api'` by default): the field reads `path` from the backend when its view mounts, and `options()` gives its items as the backend gave them, for the view to take the keys it shows.
- The rules without their own message answer `Required`, `Invalid email`, `Invalid number` or `Invalid value`; `errorMessage` replaces them for that field.
- A field without `type` is a text, like any type zod does not name: when its `parse` keeps something else (a number, a date) it breaks with `Invalid value`, so that field names its `type` (`type: 'number'`). Before zod, a field without `type` had no type rule.
- The browser validates native inputs (`type="email"`, `required`) and shows its own bubbles. To show only the field's messages, put `noValidate` on the `<form>` of the view.

`form({ components })` renders a form from a config of fields: `components` gives the view of each field type, and the view of the form gets the props `name` (its name) and `fields` (the configs of its fields). `fields()` gives the view of each field, in their order, with the props `form` and `field`: the view of its `type`, or the one of `text` when its type has none. A field with no view and no `text` stops the render with an error. `submit(event)` stops the browser's submit, validates every field of `fields` (also the untouched ones) and keeps their messages at `/form/<name>/errors`; when none breaks a rule it calls the prop `onSubmit(values)` with the values kept and returns what it returns, otherwise `undefined`. `onSubmit` is a method of the controller of the page that renders the form, so its view only passes it. `reset()` empties the values and the errors.

```tsx
// src/components/SignUp.tsx
export default form({ components: { text: Input, select: Select } }).bindView(
  ({ fields, submit, reset }) => (
    <form noValidate onSubmit={submit}>
      {fields()}
      <button>send</button>
      <button type="button" onClick={reset}>
        reset
      </button>
    </form>
  ),
);

// src/components/SignUpPage.tsx: auth gives the form its sign-up
export default authController.bindView(({ signUp }) => (
  <SignUp
    name="signUp"
    fields={[{ name: 'email', type: 'email', required: true }]}
    onSubmit={signUp}
  />
));
```

`error()` gathers the `/error/list` of every api store: `items()` gives all the errors (the `ApiResponse` of each failed request with its `timestamp`) from the newest, `remove(index)` removes the one at that index of `items()` from its store and `clear()` empties them all: a panel of errors uses them. `last()` gives the newest one and `dismiss()` removes it: an alert uses them.

`load()` reads the current page of `path` with a `QUERY` (`offset`, `limit`, `orderBy`) through the store, and `items()` gets the `ApiResponse` it kept. The list reads its current page when its view mounts. `next`, `prev` and `sort` change the page or the order and read it. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page. `page()` gives the current page (from 0), `query()` the query it reads, and `goTo(page)` moves to a page and reads it.

To read page after page instead (a "load more" button, an endless scroll), the view calls `more()`: it adds the next page of `path` in the current order to the pages read so far, with `more` of the api store, and `pages()` gives them in one `ApiResponse`; `pagesQuery()` is the query they are read with. A page with fewer than `limit` items is the last one. A change of order starts the pages again. While the view is mounted a write on `path` reads its pages again; pages left old while no view showed them are read again when one mounts.

## Layout

```
components/
└── <name>/
    └── index.ts        default-exports the component's factory: the import path
```
