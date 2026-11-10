---
status: review
owner: claude-rhf
depends_on: []
updated: 2026-11-10
---

# React Hook Form under form and field

## Goal

The values, rules, errors, submit and reset of the `form` and `field` components of `@nano-app/components` run on React Hook Form instead of code of our own, so that what forms ask for next (field arrays, schema validation, async rules, dirty and touched state) is configured instead of written. The views keep binding to controllers without hooks, and the paths `/form/<name>/values` and `/form/<name>/errors` of the `app` store keep their meaning.

## Analysis

What exists today:

- `components/field/index.ts` (58 lines): keeps the value at `/form/<form>/values/<name>` of `app`, `parse` and `format`, the number of a `number` field, the message at `/form/<form>/errors/<name>`, and the items of a select read from an api store (`options`).
- `components/form/index.ts` (55 lines): the view of each field by type, `submit` (validates every field, also the untouched ones, and calls `onSubmit(values)` synchronously, returning what it returns) and `reset`.
- `components/field/FieldRules.ts` (24 lines): `required`, `email`, `number`, `errorMessage` and the field's own `validate(value, values)`, in that order.
- `components/tests/field.test.tsx` and `form.test.tsx` pin the behavior.
- A controller's function runs on every render of its view (`createController`), so whatever lives across renders must live in a store or outside the controller.

What React Hook Form gives, checked in its docs (7.91.0, 2026-11-10):

- `createFormControl(options)` creates a form outside React: `register`, `setValue(name, value, { shouldValidate })`, `trigger`, `handleSubmit`, `reset`, `getValues`, and `subscribe({ formState, callback })` to follow values and errors without hooks.
- `register(name, rules)` works without a DOM element. Its rules cover ours: `required` with a message, `pattern` (email), `validate(value, formValues)` returning a message or `undefined`, the same signature as our `validate`; it checks `required`, then the built-in rules, then `validate`, the order of `FieldRules`.
- `handleSubmit(onValid)` validates every registered field and returns a promise of what `onValid` returns.
- Its errors are objects (`{ type, message }`): the store needs only their `message`.
- `react` is its only peer, already a peer of `components`.

What is reused: the field config (`FormField`), the paths of `app`, `parse`, `format` and the number rule (React Hook Form applies `setValueAs` only to native inputs it registers, and `field` gets values through `change`), the select `options`, the view per type of `form`.

Code balance, estimated: removes the validation of `FieldRules` and the submit and reset logic of `form` (about 25 lines); adds a registry of forms per React tree, the mapping of `FormField` to React Hook Form's rules, and the copy of values and errors into `app` (about 30 lines). Keeping today's field config, the change does not reduce lines. Moving the rules to a schema (decision 3, B) removes `FieldRules` and the mapping, about 20 lines less, and breaks the config.

## Scope

1. A registry of forms per React tree, in `components`: a `WeakMap` keyed by the tree's stores, holding one `createFormControl` per form name. Created on first use by a method of the controller, not before its `return` (decision 2).
2. On creation, the form subscribes to its values and errors and copies them into `/form/<name>/values` and `/form/<name>/errors` of `app` (errors as their messages), so views and other controllers read them as today.
3. `field` registers itself with the rules mapped from its config (`required` and `errorMessage` to `required`, `email` to `pattern`, `number` and its own `validate` to `validate`). `change(value)` applies `parse` and the number rule, then `setValue(name, value, { shouldValidate: true })`. `value()`, `error()` and `options()` read as today.
4. `form` registers every field of `fields` when its view mounts, so `submit` also validates the untouched ones. `submit(event)` is `handleSubmit(onSubmit)(event)`; `reset()` is the form's `reset`.
5. `react-hook-form` becomes a dependency of `@nano-app/components`.
6. README of the components: `submit` as decided; the table and the `field` section keep the rest.

## Out of scope

`useForm` and the other hooks (views keep binding without hooks); field arrays, async rules, dirty and touched state in the store (each one a later feature, now an option); schema resolvers unless decision 3 takes them.

## Done when

`components/tests/field.test.tsx` and `form.test.tsx` pass with only the changes the decisions accept, two forms in two trees keep their values apart, and `next build` of `frontend/tests/app` passes.

## Modules

| # | Task | Does | Done when | Depends on |
|---|---|---|---|---|
| 1 | Spike | Checks, in a scratch test, `createFormControl` with fields registered without elements: the order of the rules, `validate` with the form's values, `subscribe` of values and errors, `handleSubmit` with untouched fields, and that MobX never wraps the control | A short report in the log, per point: works as today or the exact difference | — |
| 2 | Forms on React Hook Form | Points 1 to 5 | The field and form suites pass as decided | 1 |
| 3 | Docs | Point 6 | README and this file follow the decisions | 2 |

One branch and one pull request (`feat(components): …`, or with `BREAKING CHANGE` when a decision breaks the config or `submit`), unless the maintainer splits it.

## Approach

Branch `feat/react-hook-form` from `main`, one pull request `feat(components): form and field on React Hook Form` (with a `BREAKING CHANGE` footer when decision 3B or 4A is taken). Steps, in order:

1. Spike (module 1) in a scratch test of `components/tests`, not committed: a `createFormControl` with fields registered without elements, checking the order of the rules, `validate` with the form's values, `subscribe` of values and errors, `handleSubmit` with untouched fields, and that `app.set` of the values does not hand MobX the control.
2. `pnpm --filter @nano-app/components add react-hook-form`.
3. A new `components/form/forms.ts` gets or creates the form of a name in a tree, and copies its state into `app`. Sketch, final names from the spike:

   ```ts
   /** Forms of each React tree, by name */
   const FORMS = new WeakMap<Stores, NanoObject<FormControl>>();

   /** Form of a name in a tree, created on first use with its values and errors copied to `app` */
   export default function control(oStores: Stores, sName: string): FormControl {
     // Returns the form the tree already has
     const oForms = FORMS.get(oStores) ?? {};
     FORMS.set(oStores, oForms);
     if (oForms[sName]) return oForms[sName];

     // Creates it and copies its values and the messages of its errors to `/form/<name>`
     const oForm = createFormControl().formControl;
     oForm.subscribe({
       formState: { values: true, errors: true },
       callback: ({ values, errors }) => {
         oStores.app.set(`/form/${sName}/values`, values);
         oStores.app.set(`/form/${sName}/errors`, FieldRules.messages(errors));
       },
     });
     oForms[sName] = oForm;
     return oForm;
   }
   ```

4. `FieldRules` (decision 3A) maps a `FormField` to React Hook Form's rules instead of validating: `required` with `errorMessage ?? 'Required'`, `pattern` for `email`, and one `validate` that checks `number` and then the field's own `validate(value, values)`. A second method, `messages(errors)`, turns React Hook Form's errors into `{ <name>: message }`.
5. `field`: `change(input)` registers the field with its rules and calls `setValue(name, this.parse(input), { shouldValidate: true })` on `control(stores, form)`. `value`, `error`, `parse`, `options` and its `onMount` stay.
6. `form`: its `onMount` registers every field of `fields`; `submit(event)` returns `control(stores, name).handleSubmit(onSubmit)(event)` (decision 4A) and `reset()` calls the form's `reset`. `fields()` stays.
7. Tests: `field.test.tsx` passes unchanged; `form.test.tsx` awaits `submit` when 4A is taken. A new test renders the same form name in two trees and checks that their values stay apart.
8. README of the components (point 6), this file's log, then the checks of [Before reporting a module](README.md#before-reporting-a-module) and the bundle size of `next build` before and after.

## Decisions

1. Go or no-go.
   - A: go now, for the features forms will ask for, accepting that it does not reduce lines with today's config.
   - **B (recommended)**: no-go until a form asks for field arrays, schema validation or async rules; then take this file. Today's code is 137 lines and the change does not shrink it.
2. Where the form lives across renders.
   - **A (recommended)**: a `WeakMap` in `components` keyed by the tree's stores. No change to `@nano-app/frontend`; it goes away with the tree, and the server never shares a form between requests.
   - B: a new API of the frontend stores to keep a value MobX does not observe (`setRef`). Reusable by other components; a new public API of the frontend.
3. The rules of a field.
   - **A (recommended)**: keep today's config (`required`, `type`, `errorMessage`, `validate`) and map it to React Hook Form's rules. No breaking change.
   - B: a schema per form (Standard Schema: zod, valibot) passed to `form` and its resolver; `required`, `errorMessage` and `validate` leave the field config. `FieldRules` and the mapping go; breaking change of `components`.
4. What `submit` returns.
   - **A (recommended)**: a promise of what `onSubmit` returns (React Hook Form's `handleSubmit`). Breaking for a view that used the value synchronously; `onSubmit` methods are already async in practice (`signUp`).
   - B: keep it synchronous by validating with `trigger` and calling `onSubmit` ourselves: today's contract, about 5 lines of our own stay.

## Risks

- React Hook Form is built around `useForm`; `createFormControl` is newer and less documented. The spike pins what the components rely on.
- Two copies of the values (React Hook Form's and the `app` store) are written by the subscription only: a write to `/form/<name>/values` from another controller is not seen by React Hook Form.
- A dependency in the client bundle (about 10 kB gzipped, to be measured in `next build`).

## Log

- 2026-11-10 · claude · Plan written from the analysis above (`form`, `field`, `FieldRules`, their tests, React Hook Form 7.91.0 docs). Waiting for the first round of decisions; module 1 starts after them.
- 2026-11-10 · claude-rhf · Decisions: 1A (go now), 2A (`WeakMap` per tree), 3B (Standard Schema per form, `required`, `errorMessage`, `validate` and the email/number checks leave the field), 4A (`submit` returns a promise). Points of 3B: 5A (`schema` optional; without it the form sends the values kept), 6A (`onSubmit` gets the schema's output), 7A (`@hookform/resolvers/standard-schema`).
- 2026-11-10 · claude-rhf · Spike: `createFormControl` with fields registered without elements keeps values and errors through `subscribe`, validates cross-field rules with the form's values, validates untouched fields on `handleSubmit`, returns what `onSubmit` returns (or `undefined`), and `reset` empties both. MobX keeps an observable copy, not the control.
- 2026-11-10 · claude-rhf · Done on `feat/react-hook-form`: `components/form/forms.ts` (forms per tree, state copied to `/form/<name>` of `app`), `FieldRules` removed, `field.change` through `setValue`, `form` with `schema`, `submit` and `reset` on the control; tests and the test app's login on zod; README. Tests run in CI only, as the maintainer asked; the bundle size of `next build` before and after was not measured.
