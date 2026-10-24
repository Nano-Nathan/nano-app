# @nano-app/components

[![components](https://img.shields.io/npm/v/@nano-app/components?label=components)](https://www.npmjs.com/package/@nano-app/components)

Official components for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend). A component is the logic of a piece of UI, a controller ready to use: you write only the view. One import path per component: `@nano-app/components/<name>`. No markup and no styles.

```bash
pnpm add @nano-app/frontend @nano-app/components
```

```tsx
// src/components/Users.tsx
'use client';

import list from '@nano-app/components/list';

export default list({ path: '/users', top: 20 }).bindView(({ items, page, next, prev, sort }) => (
  <section>
    <button onClick={() => sort('name')}>name</button>
    <ul>{items?.map(oUser => <li key={oUser.id}>{oUser.name}</li>)}</ul>
    <button onClick={prev}>←</button> {page + 1} <button onClick={next}>→</button>
  </section>
));
```

- Each call (`list({ … })`) returns a controller of `@nano-app/frontend`: bind views to it with `bindView`, and change or add methods with `extend(({ props, stores }) => ({ … }))`.
- A component keeps its state in the `app` store, under its name (`/list`). Two components of the same kind share it.
- A component that reads the backend uses the app's `api` store (the first one). Without one it renders without data and asks nothing.

## Components

| Component | Import | Options | The view receives |
|---|---|---|---|
| `list` | `import list from '@nano-app/components/list'` | `path`, `top` | `items`, `page` (from 0), `busy`, `next()`, `prev()`, `sort(field)` |

`list` reads `path` with a `QUERY` (`skip`, `top`, `orderby`) through the store, so the backend answers that page. `sort` orders by one field, ascending and then descending, and goes back to the first page. `prev` stays on the first page.

## Layout

```
components/
└── <name>/
    └── index.ts        default-exports the component's factory: the import path
```
