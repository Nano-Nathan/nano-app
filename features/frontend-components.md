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
- **Its state lives in the `app` store**, under its name (`/list`), with no option to move it: two components of the same kind share it.
- **Its api store** is the app's only `api` store, or the one named in `store` when there are several; a missing or wrong one fails with the fix.
- **Extending** in the frontend: `controller.extend(methods)` returns a new controller with an object of methods merged over its own; a method with the same name wins, the original controller does not change.

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
