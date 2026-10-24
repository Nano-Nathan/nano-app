---
status: in-progress
owner: projects-thread
depends_on: [frontend]
updated: 2026-10-24
---

# Frontend components

## Goal

`@nano-app/components` ships default components the way `@nano-app/plugins` ships plugins: the package gives the logic (a controller) and the consumer only writes the view.

## Decided

- **Its own package** `@nano-app/components` (`components/`), released apart with `components-v*` tags and `publish-components.yml`. `@nano-app/frontend` and `react` are peers, so the views use the app's provider.
- **A component is a factory** like a plugin: `import list from '@nano-app/components/list'`, then `list({ … }).bindView(view)`. A plain name, not `useList` (a hook runs in the render) nor `createList`.
- **Its state lives in its api store**, under its name (`/list/page`, `/list/orderby`: public names, no prefixes): `ApiStore` extends `Store`, so an api store has `get`, `set` and `data` too, apart from what it read. Two components of the same kind on one store share it.
- **Its api store** is the one named in `store`, `api` by default; used with `?.`, without validating that it exists.
- **Extending** in the frontend: `controller.extend(context => methods)` returns a new controller with those methods merged over its own; they receive the same context as the controller's, a method with the same name wins, the original controller does not change.

## Scope

- First version, to review: `extend` in the frontend, the package (build, release, tests) and `list` (paged and sortable reads of a path: `items`, `page`, `busy`, `next`, `prev`, `sort`).
- Next components (`form`, `login`/`session`/`logout`), listed point by point with the maintainer. `form` needs the errors module of [frontend](frontend.md); `login` needs its auth module.
- The test app renders a component with its own view.

## Out of scope

Styles, markup or any UI kit.

## Done when

A default component is released and the test app renders it with its own view.

## Log

- 2026-10-24 · projects-thread · Proposed by the maintainer while planning the first frontend release.
- 2026-10-24 · projects-thread · Decided with the maintainer: own package, factories, state in `app`, the only api store or `store`, `extend` with an object of methods. First version on `feat/frontend--components`: `extend`, the package and `list`. Missing: the maintainer's review, the test app and npm's Trusted Publisher for `publish-components.yml`.
- 2026-10-24 · projects-thread · Review of #43: no `store` option and no validation of the api store (`?.`), `extend` receives the context, state paths without prefixes (`/list/page`, `/list/orderby`).
- 2026-10-24 · projects-thread · Review of #43: `store` back as an option, `api` by default. To decide: whether the list's state goes to the api store instead of `app`.
- 2026-10-24 · projects-thread · Decided: `ApiStore` extends `Store` (`get`/`set`/`data`, its cache stays private) and `list` keeps its state in its api store instead of `app`.
