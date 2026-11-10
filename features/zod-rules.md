---
status: review
owner: claude-zod
depends_on: []
updated: 2026-11-10
---

# Field rules on zod

## Goal

The rules of each field of `@nano-app/components` are a [zod](https://zod.dev) schema built from its config instead of rules written by hand, so a field takes any zod method of its type (`min`, `max`, `regex`…) without new code. `form` and `field` keep handling values, errors, submit and reset as they do.

## Analysis

What exists today:

- `components/field/FieldRules.ts`: hand-written rules: `required`, then `type` `email` and `number`, then the field's `validate(value, values)`; `errorMessage` replaces the default messages.
- `components/field/index.ts` and `components/form/index.ts`: keep values and errors at `/form/<name>` of `app`; `change`, `submit` and `reset` call `FieldRules.validate`.

## Scope

1. `components/field/schema.ts` builds the zod schema of a field: `type` names the zod type (`email`, `number`, `url`, `uuid`, `boolean`; `checkbox` is a boolean, `date` an ISO day, any other type a text), `required` breaks on a value missing or `''` (without it, an empty value passes), and `rules` calls the zod methods of that type by name with their value or an array of arguments (`rules: { min: [3, 'Too short'], max: 20 }`).
2. `FieldRules.validate` gives the first message of that schema, then the one of the field's `validate(value, values)`. Rules only check: they never change the value kept (`parse` does).
3. The rules without their own message answer `Required`, `Invalid email`, `Invalid number` or `Invalid value`; `errorMessage` replaces them for that field.
4. `zod` becomes a dependency of `@nano-app/components`.
5. README of the components and the field tests follow the rules above.

## Out of scope

React Hook Form (dropped by the maintainer), schema resolvers, field arrays, async rules, dirty and touched state.

## Done when

`components/tests/field.test.tsx` and `form.test.tsx` pass, with a test of `rules` mapped to zod methods.

## Decisions

1. React Hook Form: dropped; `form` and `field` stay as on `main` and only the rules move to zod.
2. Rules in the config: zod methods by name in a `rules` key of the field.
3. Types: `type` names a zod constructor, with `checkbox` and `date` as aliases and a text otherwise.
4. Rules only check and never change the value kept (`parse` does).
5. A field without `type` is a text: a `parse` that keeps something else breaks with `Invalid value`. It breaks the public API of `@nano-app/components`, so the pull request to `main` ends with a `BREAKING CHANGE` footer.

## Log

- 2026-11-10 · claude-rhf · First take on React Hook Form, with each field validating with its own zod rules.
- 2026-11-10 · claude-zod · Review: the maintainer drops React Hook Form and keeps only zod. The branch is rewritten from `main`: `form` and `field` as on `main`, `FieldRules` on the zod schema of `schema.ts`, `react-hook-form` out of the dependencies.
- 2026-11-10 · claude-zod · The maintainer splits it as the module `feat/react-hook-form--zod-rules` of `feat/react-hook-form` and accepts that a field without `type` validates as a text (decision 5): README, test and the `BREAKING CHANGE` footer of #123.
