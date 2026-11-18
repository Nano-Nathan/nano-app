# @nano-app/controllers

[![controllers](https://img.shields.io/npm/v/@nano-app/controllers?label=controllers)](https://www.npmjs.com/package/@nano-app/controllers)

Official controllers for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend). Each one is the logic of a piece of UI, ready to use: you write only the view, or take it from [`@nano-app/mantine`](../mantine/README.md). Every controller leaves from one import: `import { AuthController } from '@nano-app/controllers'`. No markup and no styles.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@nano-app/frontend` 0.16, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/frontend @nano-app/controllers
```

```tsx
// src/components/Users.tsx
'use client';

import { createView } from '@nano-app/frontend';
import { CollectionController } from '@nano-app/controllers';

class UsersController extends CollectionController {
  protected root = '/collection/users';
  protected path = '/users';
  protected limit = 20;
}

export default createView(UsersController, users => (
  <section>
    <button onClick={() => users.sort('name')}>name</button>
    <ul>
      {users.items()?.result?.map(oUser => (
        <li key={oUser.id}>{oUser.name}</li>
      ))}
    </ul>
    <button onClick={users.prev}>←</button> {users.page() + 1}{' '}
    <button onClick={users.next}>→</button>
  </section>
));
```

- Every controller is a `Controller` class of `@nano-app/frontend`: use it with `createView`, and change or add methods by extending it (`class X extends AuthController { … }`, the original through `super`).
- Its options are `protected` fields: a subclass sets them (`protected root = '/collection/users';`), and the view does not see them. A field without a default is `abstract`: the class must be extended, and TypeScript asks for every one of them.
- The props of a view carry the data of each use (`form`, `field`, `name`, `fields`, `onSubmit`).
- A controller reads what it needs when its view mounts (`onMount`): the view only renders. The requests in progress are in the store's `/busy`.
- A controller keeps its state under `root` in `state`, the `app` store by default: a subclass moves it to another store with `protected state = this.stores.ui;`.
- Every controller has one on/off flag under its `root`: `isToggled()` reads it and `toggle()` switches it (a mode, a drawer).
- Every controller reads the app's texts with `text(key)` (`text('nano.login.title')`), from the `app` store whatever its `state`, in the locale at `/locale`.
- A controller that reads the backend uses the `api` store, which every app has (its URL in `API_API_URL`). A subclass moves it to another api store as a field: `protected api = this.stores.admin;`, typed by the app's `nano-app-env.d.ts`. Any other store is used directly (`this.stores.payments.POST(…)`).

## Controllers

| Component              | Import                                                         | Fields                                                    | Methods                                                                                             | Props                        | State                                                  |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| `AuthController`       | `import { AuthController } from '@nano-app/controllers'`       | `api` (`api`), `kind` (`'email'`), `home` (the prop, `/`) | `signIn(body, kind)`, `signUp(body, kind)`, `signOut()`, `send(values)`                             | —                            | `app`: `/auth/isToggled`                               |
| `FieldController`      | `import { FieldController } from '@nano-app/controllers'`      | —                                                         | `value()`, `error()`, `change(value)`, `options()`                                                  | `form`, `field`              | `app`: `/form/<form>/values`, `/form/<form>/errors`    |
| `FormController`       | `import { FormController } from '@nano-app/controllers'`       | `components` (the prop)                                   | `fields()`, `submit(event)`, `reset()`                                                              | `name`, `fields`, `onSubmit` | `app`: `/form/<name>`                                  |
| `MessageController`    | `import { MessageController } from '@nano-app/controllers'`    | —                                                         | `items()`, `remove(index)`, `clear()`, `last()`, `dismiss()`                                        | —                            | every store's `/message/list`                          |
| `CollectionController` | `import { CollectionController } from '@nano-app/controllers'` | `api` (`api`), `root`, `path` (abstract), `limit` (`50`)  | `load()`, `items()`, `page()`, `goTo(page)`, `next()`, `prev()`, `sort(field)`, `more()`, `pages()` | —                            | `app`: `<root>/page`, `<root>/orderBy`, `<root>/pages` |

## Auth

`signIn(body)` and `signUp(body)` send `body` to Better Auth's `POST /auth/sign-in/<kind>` and `/auth/sign-up/<kind>` of the store's backend (`{ email, password }` for `email`), and `signOut()` to `/auth/sign-out`. Each one returns the store's `ApiResponse`. Better Auth keeps the session in its cookie; a page that needs it uses `createPage` of `@nano-app/frontend/server`.

`signIn` and `signUp` send the body with `callbackURL: home`, the page a provider comes back to, and on `success` go where the answer leads: the `url` of its `result` (a provider's page: `signIn({ provider: 'google' }, 'social')`), or `home`, the prop `home` (`/` by default). For a login card, `send({ email, password })` signs in, or signs up while its flag is on (`isToggled()`, `toggle()` of every controller), with the email as the name unless the values bring one. The values go to Better Auth as they are: a field of the form beyond `email`, `password` and `name` (`phone`) is kept only when the backend declares it in `auth.user.additionalFields`; Better Auth drops the others. `isBusy()`, of every controller that reads the backend, says whether a request of `api` is out, for the view to show its loader.

```tsx
// src/Logout.controller.ts
export default class LogoutController extends AuthController {
  public async logout(): Promise<void> {
    // Signs out and goes to the login
    const oResponse = await this.signOut();
    if (oResponse.success) this.router.push('/login');
  }
}

// src/components/Logout.tsx
export default createView(LogoutController, logout => (
  <button onClick={logout.logout}>sign out</button>
));
```

- Better Auth checks the `Origin` of every `POST`: add the URL of the frontend to its `trustedOrigins` in the backend.

## Field

`FieldController` is the controller of a field view: create one view per kind of input (a text, a select, a date picker) and give it the props `form` (the name of its form) and `field` (its config).

```tsx
// src/components/Input.tsx: an input of the field's type with its error
export default createView(FieldController, (input, { field: oField }) => (
  <label>
    {oField.label}
    <input
      type={oField.type ?? 'text'}
      disabled={oField.disabled}
      value={input.value() ?? ''}
      onChange={oEvent => input.change(oEvent.target.value)}
    />
    <small>{input.error()}</small>
  </label>
));

<Input
  form="signUp"
  field={{ name: 'email', label: 'Email', type: 'email', validation: z.email() }}
/>;
```

- A field is `{ name, type, validation, format, parse, options }`; its other keys (`label`, `disabled`) pass as is to its view.
- `validation` holds the rules of its value, a [zod](https://zod.dev) schema written by the app (`z.email('Invalid email')`, `z.string().min(3, 'Too short')`, `z.number().optional()`). A rule between fields (a password and its repeat) goes in the `onSubmit` of the form.
- `change(value)` keeps the value at `/form/<form>/values/<name>` as the view gives it (a text, a boolean, the ISO day of a date input), an empty text as no value (`undefined`), and a `number` field as a number when its text is that number as is (`'12'`, while `'1.'` stays a text). Then it keeps at `/form/<form>/errors/<name>` the message of the first rule of its validation the value breaks. `error()` gives that message.
- `error()` gives the message as the app's texts have it when the message is a key (`z.email('form.invalidEmail')`, see [Texts](../frontend/README.md#texts)), and as it is otherwise.
- `parse(input)` replaces what `change` keeps, and `format(value)` what `value()` gives: a price kept as `1234` and shown as `$1.234`.
- A select takes `options: { path }`: the field reads `path` with `GET` when its view mounts, and `options()` gives the `result` of the answer, for the view to take the keys it shows. It reads the `api` store; a subclass moves it (`protected api = this.stores.admin;`).
- Without a `validation` a field breaks no rule.
- The browser validates native inputs (`type="email"`, `required`) and shows its own bubbles. To show only the field's messages, put `noValidate` on the `<form>` of the view.

## Form

`FormController` renders a form from a config of fields. `components` is the view of each field type, from its prop or set by a subclass; the view of the form gets the props `name` (its name), `fields` (the configs of its fields) and `onSubmit`.

- `fields()` gives the view of each field, in their order, with the props `form` and `field`: the view of its `type`, or the one of `text` when its type has none. A field with no view and no `text` stops the render with an error.
- `submit(event)` stops the browser's submit, validates every field of `fields` (also the untouched ones) and keeps their messages at `/form/<name>/errors`; when none breaks a rule it calls the prop `onSubmit(values)` with the values kept and returns what it returns, otherwise `undefined`.
- `reset()` empties the values and the errors.
- `fields()` reads the props of the last render on screen: `name` and `fields` are set once per form, not changed while it is mounted.

```tsx
// src/components/SignUp.tsx
class SignUpFormController extends FormController {
  protected components = { text: Input, select: Select };
}

export default createView(SignUpFormController, signUp => (
  <form noValidate onSubmit={signUp.submit}>
    {signUp.fields()}
    <button>send</button>
    <button type="button" onClick={signUp.reset}>
      reset
    </button>
  </form>
));

// src/components/SignUpPage.tsx: auth gives the form its sign-up
export default createView(LogoutController, auth => (
  <SignUp
    name="signUp"
    fields={[
      { name: 'email', type: 'email', validation: z.email() },
      { name: 'password', type: 'password', validation: z.string().min(8) },
    ]}
    onSubmit={auth.signUp}
  />
));
```

## Message

`MessageController` gathers the `/message/list` of every api store: the answers that brought a `message` and the failed requests, each `ApiResponse` with its `timestamp`. `items()` gives them from the newest, `remove(index)` removes the one at that index of `items()` from its store and `clear()` empties them all: a panel of messages uses them. `last()` gives the newest one and `dismiss()` removes it: an alert uses them. `flush(fnShow)` gives each one to `fnShow` and empties them: toasts use it. Each one has its `type`: `success`, `info`, `warning` or `error`, the backend's or by its result.

## Collection

`load()` reads the current page of `path` with a `QUERY` (`offset`, `limit`, `orderBy`) through the store, and `items()` gets the `ApiResponse` it kept. The collection reads its current page when its view mounts. `next`, `prev` and `sort` change the page or the order and read it. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page. `page()` gives the current page (from 0), and `goTo(page)` moves to a page and reads it.

To read page after page instead (a "load more" button, an endless scroll), the view calls `more()`: it reads the page after the items read so far, in the current order, and keeps every item in one `ApiResponse` that `pages()` gives. A change of order starts the pages again.

## Layout

```
controllers/src/
├── index.ts                  the import path: exports every controller and its types
├── auth/                     Auth.controller.ts, Login.controller.ts
├── form/                     Form.controller.ts, Field.controller.ts, validate.ts
├── Collection.controller.ts
├── Message.controller.ts
├── utils/                    AppController (`state`, `root`, `get`/`set`) and ApiController (its `api`)
└── types/
```
