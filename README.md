# nano-app

[![backend](https://img.shields.io/npm/v/@nano-app/backend?label=backend)](https://www.npmjs.com/package/@nano-app/backend)
[![plugins](https://img.shields.io/npm/v/@nano-app/plugins?label=plugins)](https://www.npmjs.com/package/@nano-app/plugins)
[![frontend](https://img.shields.io/npm/v/@nano-app/frontend?label=frontend)](https://www.npmjs.com/package/@nano-app/frontend)
[![components](https://img.shields.io/npm/v/@nano-app/components?label=components)](https://www.npmjs.com/package/@nano-app/components)
[![license](https://img.shields.io/npm/l/@nano-app/backend)](./LICENSE)

File-convention framework for Node.js. In the backend you write `*.route.ts` files: `@nano-app/backend` discovers them, mounts an Express 5 server, and turns every `ApiResponse` into HTTP. In a Next.js frontend you write `*.store.ts` files and controllers: `@nano-app/frontend` keeps the UI state in stores and talks to the backend through its proxy.

This repository publishes **`@nano-app/backend`**, **`@nano-app/plugins`** (the official backend plugins), **`@nano-app/frontend`** and **`@nano-app/components`** (the official frontend components). You add your own plugins with `createPlugin`, or publish them as separate packages.

While the version is `0.x`, the public API can change.

## Install

```bash
pnpm add @nano-app/backend
```

Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.

## Quick start

```
src/
├── app.ts
└── routes/
    └── health.route.ts     →  /health
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';

createNanoApp({ port: 3000 });
```

```ts
// src/routes/health.route.ts
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async () => ({ result: { status: 'ok' } }),
});
```

The file path is the URL. Full API, database, and plugin contract: [`backend/README.md`](backend/README.md). The frontend (stores, controllers and the proxy to the backend): [`frontend/README.md`](frontend/README.md).

## Packages

| Package | Directory | npm | Role |
|---|---|---|---|
| `@nano-app/backend` | `backend/` | published | Express server, convention routes, optional PostgreSQL and Better Auth |
| `@nano-app/plugins` | `plugins/` | published | Official backend plugins: `import <name> from '@nano-app/plugins/<name>'` |
| `@nano-app/frontend` | `frontend/` | published | Next.js stores, controllers and the proxy to the backend |
| `@nano-app/components` | `components/` | published | Official frontend components: `import <name> from '@nano-app/components/<name>'` |
| `@nano-app/core` | `core/` | private | Convention loader, types and constants, inlined into the backend, frontend and components builds |

Each package has its tests in its `tests/` folder (`frontend/tests/app` is a Next app that uses the frontend and the components). Each published package has its own version.

## Plugins

A plugin is a directory of `*.route.ts` files plus a `createPlugin` factory. List it in `createNanoApp({ plugins })`. Nothing is mounted by default.

The official ones: [`plugins/`](plugins/README.md). How to write one, and how to publish it for other people: [PLUGINS.md](PLUGINS.md).

## Develop

```bash
pnpm install
pnpm test
pnpm build
```

PostgreSQL tests run only when `DATABASE_URL` is set. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Cristian Serrano.
