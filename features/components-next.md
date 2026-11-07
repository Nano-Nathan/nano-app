---
status: in-progress
owner: projects-thread
depends_on: []
updated: 2026-11-07
---

# Next components

## Goal

More components in `@nano-app/components`, the same way as `list`: a factory that returns a controller, its state in its api store, and the consumer writes the view.

## Scope

- `form` and `field`: a form built from a config of fields, with default validations; the errors of the backend are shown with the `error` component.
- `auth`: the sessions of an `api` store ([frontend README](../frontend/README.md#sessions)) and `navTo(url)`, one controller for the login, the logout and the private layout.
- Each one listed point by point with the maintainer before writing code.

## Out of scope

Styles, markup or any UI kit.

## Done when

`form`, `field` and `auth` are released and the test app renders them with its own views.

## Modules

`form` is split into modules on `feat/components-form`; each one is a pull request to it, and #62 takes it to `main`.

| Module | What it does | Depends on |
|---|---|---|
| `field` (`feat/components-form--field`) | `field()`: a field view's `value()`, `error()` and `change(value)` at `/form/<form>` of `app`, with the rules `required`, `email`, `number`, the field's `errorMessage` and `validate` | — |
| `field` defaults (`feat/components-form--field-defaults`) | A `number` field keeps a number; the field's `format` and `parse`; a select's `options()`, read from an api store when its view mounts | `field` |
| `field-rules` (`feat/components-form--field-rules`) | The rules of a field in `FieldRules.validate(field, values)`, which `field`'s `validate` calls | `field` defaults |
| `form-render` (`feat/components-form--form-render`) | `form({ components })`: `fields()` renders the view of each field's type, `text` when its type has none | `field` defaults |
| `form-submit` (`feat/components-form--form-submit`) | `submit(event)` validates every field with `FieldRules` and calls `onSubmit(values)`, `reset()` empties the form | `field-rules`, `form-render` |
| `login` (`feat/components-form--login`) | The test app's login uses `form` and `auth` | `form-submit` |

## Log

- 2026-10-24 · projects-thread · Split from frontend-components when `list` was released and the test app rendered it.
- 2026-10-27 · projects-thread · Started `login`: points listed to the maintainer, waiting for the OK.
- 2026-10-27 · projects-thread · `login`, `session` and `logout` became one `auth` component: `auth({ kind, store })` gives `signIn(body)`, `signUp(body)`, `signOut()`, `load()` and `navTo(url)` (Next's `router.push`). Components connect by nesting views with props (the form gets `onSubmit`). Implemented on `feat/components-auth`.
- 2026-10-27 · projects-thread · `auth` merged to `main` (#61). Missing: `form`.
- 2026-10-27 · projects-thread · `form` and `field` agreed point by point: one `field()` controller for every field view, one `form({ components, messages })` that renders a view per field type (`text` by default) from the `fields` prop, state at `/form/<name>` of `app`, rules `required`, `email`, `number` and the field's `validate`. Implemented on `feat/components-form`; `required` only asks for a value, and the README recommends `noValidate` on the view.
- 2026-11-07 · projects-thread · The maintainer split `form` into the modules `field` and `form`, one pull request each to `feat/components-form`. The full version stays on `backup/components-form-full`.
- 2026-11-07 · projects-thread · `field` is a controller, not a function; the default rules stay in it and a field's `errorMessage` replaces their message (no `messages` option). `form` is set aside until `field` is merged.
- 2026-11-07 · projects-thread · Standard of components (#94): every component is a function that infers the controller it returns, so `field` is `field()` again, without a methods type.
- 2026-11-07 · projects-thread · `field` merged to `feat/components-form` (#91). Defaults compared with personal-app and agreed: `label` and `disabled` need no code (they pass to the view), a `number` field keeps a number, `date` keeps the ISO day of the input, `format` and `parse` per field (the currency stays in the app), a select's `options: { path, store }`, read in `callbacks.onMount` when its view mounts (the maintainer: the view only styles), and `options()` giving the items as they are (the maintainer: the view picks their keys).
- 2026-11-07 · projects-thread · Standard of controllers (`refactor/controller-callbacks`): the function of `createController` returns its object, with only `const` read from the context or options before the `return`, `callbacks.onMount` run when each view mounts (`extend` runs both, the original's first) and `router` in the context; `list` and `auth` read what they need on mount, and the view only renders.
- 2026-11-07 · projects-thread · `form` split into `field-rules`, `form-render`, `form-submit` and `login`, one at a time in that order (the maintainer: no modules in parallel). `field-rules` moves the rules of `field` to `FieldRules`, so `form` validates every field with the same source.
- 2026-11-07 · projects-thread · `field-rules` merged (#100). `form-render` agreed: `form({ components })` without `messages`, props `name` and `fields`, and `fields()` throws the error of a field with no view and no `text` when it renders (the maintainer: the logic stays in the methods).
