# nano-app

[![npm](https://img.shields.io/npm/v/@nano-app/backend)](https://www.npmjs.com/package/@nano-app/backend)
[![license](https://img.shields.io/npm/l/@nano-app/backend)](./LICENSE)

File-convention backend for Node.js. You write `*.route.ts` files. `@nano-app/backend` discovers them, mounts an Express 5 server, and turns every `ApiResponse` into HTTP.

This repository publishes **`@nano-app/backend`**. It does not ship official plugins. You add your own with `createPlugin`, or publish them as separate packages.

While the version is `0.x`, the public API can change.

## Install

```bash
npm install @nano-app/backend
```

Node.js 20 or newer. ESM only.

## Quick start

```
src/
├── app.ts
└── routes/
    └── health.route.ts     →  /health
```

```ts
// src/app.ts
import { createNanoApp } from "@nano-app/backend";

createNanoApp({ port: 3000 });
```

```ts
// src/routes/health.route.ts
import { createRoute } from "@nano-app/backend";

export default createRoute({
  GET: async () => ({ success: true, result: { status: "ok" } }),
});
```

The file path is the URL. Full API, database, and plugin contract: [`backend/README.md`](backend/README.md).

## Packages

| Package | Directory | npm | Role |
|---|---|---|---|
| `@nano-app/backend` | `backend/` | published | Express server, convention routes, optional PostgreSQL |
| `@nano-app/core` | `core/` | private | Convention loader, inlined into the backend build |

Tests are `backend/tests`.

## Plugins

A plugin is a directory of `*.route.ts` files plus a `createPlugin` factory. List it in `createNanoApp({ plugins })`. Nothing is mounted by default.

How to write one, and how to publish it for other people: [PLUGINS.md](PLUGINS.md).

## Develop

```bash
pnpm install
pnpm --filter @nano-app/backend test
pnpm --filter @nano-app/backend build
```

PostgreSQL tests run only when `DATABASE_URL` is set. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Cristian Serrano.
