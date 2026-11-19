# @nano-app/controllers

Ready controllers for `@nano-app/frontend`. No markup and no styles: write the view, or take it from [`@nano-app/mantine`](./mantine).

```bash
pnpm add @nano-app/frontend @nano-app/controllers
```

- `@nano-app/frontend` 0.16, Next 16.3 and React 19 or newer, as peer dependencies.

```ts
import { AuthController, CollectionController } from '@nano-app/controllers';
```

## Common to every controller

| Member        | Description                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `root`        | Path of its state.                                                                                                     |
| `state`       | Store of its state, `app` by default: `protected state = this.stores.ui;`.                                             |
| `api`         | The api store it reads, `api` by default: `protected api = this.stores.admin;`.                                        |
| `isToggled()` | Its on/off flag under `root` (a mode, a drawer).                                                                       |
| `toggle()`    | Switches the flag.                                                                                                     |
| `isBusy()`    | Whether a request of this controller is out, counted at `<root>/requests` of `api`; of the whole store without `root`. |

- Options are `protected` fields set by a subclass. A field without a default is `abstract`.
- Change a method by extending: `class X extends AuthController`, the original through `super`.

## AuthController

Sign-up, sign-in and sign-out with Better Auth of the `api` store's backend.

| Field   | Default               |
| ------- | --------------------- |
| `kind`  | `'email'`             |
| `home`  | the prop, or `/`      |
| `login` | the prop, or `/login` |

| Method               | Description                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `signIn(body, kind)` | `POST /auth/sign-in/<kind>`. On `success`, goes to the `url` of the result (a provider) or to `home`. |
| `signUp(body, kind)` | `POST /auth/sign-up/<kind>`. Same as `signIn`.                                                        |
| `signOut()`          | `POST /auth/sign-out`. On `success`, goes to `login`.                                                 |
| `send(values)`       | Signs in, or signs up while its flag is on, with the email as the name unless `values` bring one.     |

- `signIn` and `signUp` send `callbackURL: home` and `errorCallbackURL`, the current page. When its view mounts, an `?error=` of a provider becomes the message `nano.auth.<error>` and is dropped from the URL.
- Values beyond `email`, `password` and `name` are kept only when the backend declares them in `auth.user.additionalFields`.
- Better Auth checks the `Origin` of every `POST`: add the frontend's URL to its `trustedOrigins`.
- State: `/auth/isToggled` of `app`, `/auth/requests` of `api`.

## FieldController

The controller of a field view. Props: `form` (the form's name) and `field` (its config).

| Method          | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `value()`       | The value kept, through `format`.                              |
| `change(value)` | Keeps the value, through `parse`, and validates it.            |
| `error()`       | The text of the first rule the value breaks.                   |
| `label()`       | The text of the field's `label` key.                           |
| `options()`     | The `result` of `GET options.path`, read when the view mounts. |

### FormField

| Key          | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| `name`       | Key of its value.                                                               |
| `type`       | Type of its view, `text` by default. `number` keeps a numeric text as a number. |
| `label`      | Key of the text of its label.                                                   |
| `validation` | A zod schema. Its messages are keys of the texts.                               |
| `format`     | What the view shows of the value kept.                                          |
| `parse`      | What to keep of what the view gives.                                            |
| `options`    | `{ path }`: the items of a select, from the `api` store.                        |
| any other    | Passed as is to its view (`disabled`).                                          |

- An empty text is kept as `undefined`.
- State: `/form/<form>/values/<name>` and `/form/<form>/errors/<name>` of `app`.
- To show only the field's messages, put `noValidate` on the `<form>`.

## FormController

A form from a list of fields. Props: `name`, `fields`, `onSubmit`, and `components` unless a subclass sets them.

| Field        | Description                                     |
| ------------ | ----------------------------------------------- |
| `components` | The view of each field type: `{ text: Input }`. |

| Method          | Description                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `fields()`      | The view of each field, in order: the view of its `type`, or of `text`. Neither stops the render.        |
| `submit(event)` | Stops the browser's submit, validates every field, and calls `onSubmit(values)` when none breaks a rule. |
| `reset()`       | Empties the values and the errors.                                                                       |

A rule between fields (a password and its repeat) goes in `onSubmit`. `name` and `fields` are set once per form.

## CollectionController

A list of a backend path, paged and sorted with `QUERY` (`offset`, `limit`, `orderBy`).

| Field   | Default  |
| ------- | -------- |
| `root`  | abstract |
| `path`  | abstract |
| `limit` | `50`     |

| Method             | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `load()`           | Reads the current page.                                              |
| `items()`          | The `ApiResponse` of the current page.                               |
| `page()`           | The current page, from 0.                                            |
| `goTo(page)`       | Moves to a page and reads it.                                        |
| `next()`, `prev()` | Moves one page. `prev` stays on the first.                           |
| `sort(field)`      | Orders by one field, ascending then descending, from the first page. |
| `more()`           | Reads the next page and keeps every item read in one answer.         |
| `pages()`          | The `ApiResponse` of every page `more()` read.                       |

It reads its page when its view mounts. State: `<root>/page`, `<root>/orderBy`, `<root>/pages` of `app`.

## NavController

| Method           | Description                         |
| ---------------- | ----------------------------------- |
| `isActive(href)` | Whether `href` is the current page. |
| `close()`        | Closes the menu.                    |

Its flag is the menu open, at `/nav/isToggled` of `app`.

## MessageController

The `/message/list` of every api store: each answer with a `message` and each failed request.

| Method          | Description                                  |
| --------------- | -------------------------------------------- |
| `items()`       | Every message, newest first.                 |
| `remove(index)` | Removes the one at that index of `items()`.  |
| `clear()`       | Removes them all.                            |
| `last()`        | The newest.                                  |
| `dismiss()`     | Removes the newest.                          |
| `flush(fnShow)` | Gives each one to `fnShow` and removes them. |

Each message has its `type`: `success`, `info`, `warning` or `error`.
