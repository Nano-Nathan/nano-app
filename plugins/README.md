# @nano-app/plugins

[![plugins](https://img.shields.io/npm/v/@nano-app/plugins?label=plugins)](https://www.npmjs.com/package/@nano-app/plugins)

Official plugins for [`@nano-app/backend`](https://www.npmjs.com/package/@nano-app/backend). One import path per plugin: `@nano-app/plugins/<name>`. Nothing is mounted unless you list it.

```bash
pnpm add @nano-app/backend @nano-app/plugins
```

```ts
import { createNanoApp } from '@nano-app/backend';
import health from '@nano-app/plugins/health';

createNanoApp({ plugins: [health()] });
```

## Official plugins

| Plugin   | Import                                          | Endpoints                                                                                                                                                                                                                                 | Options                          |
| -------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `health` | `import health from '@nano-app/plugins/health'` | `GET /health` → `{ success: true, result: { status: "ok" } }`                                                                                                                                                                             | `basePath` (default `"/health"`) |
| `crud`   | `import crud from '@nano-app/plugins/crud'`     | On the tables listed in `models`, by their name in the app's schema (any other answers 404): `GET` and `QUERY` on `/api/<model>{/<id>}` → a list `{ result }` or one record, with `QueryParams` as the body of `QUERY`: Drizzle's relational query on the table alone (`where`, `columns`, `orderBy`, `limit`, `offset`): a relation in `where` or `with` answers 400; `POST /api/<model>`, `PUT` and `DELETE` on `/api/<model>/<id>` → the record created, updated or deleted. Postgres casts `<id>` to the type of the `id` column. With Better Auth, each method asks for a permission on the table: `read` (`GET`, `QUERY`), `create`, `update`, `delete`, see [crud and related tables](#crud-and-related-tables) | `models` (the published ones), `schema` (the app's Drizzle schema, as in `mainPlugin.database`), `basePath` (default `"/api"`)    |
| `rate-limit` | `import rateLimit from '@nano-app/plugins/rate-limit'` | None: limits every request of the routes and plugins mounted after it, per client IP (see [Client IP](../backend/README.md#client-ip)). Each request spends a token of the client's bucket, which holds `capacity` and refills `refillPerSecond` tokens per second; without one it answers `429` with `message` and `Retry-After` (seconds until the next token). List it first in `plugins`. The buckets live in the memory of each process | `capacity` (default `100`), `refillPerSecond` (default `1`), `message` |

What is not CRUD, such as creating a record with business logic, goes in a route of your own with its own URL: a route of yours on a `crud` URL takes every method of it.

### crud and related tables

A `crud` query never leaves its table: its client knows the app's tables but none of their relations, so a relation in `where` or `with` answers 400. Better Auth's tables (`user`, `account` with its password hashes, `session` with its tokens) are reached only when they are in `models`; never publish `account`, `session` or `verification`. What needs related tables goes in a route of your own.

### Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the plugin factory: the import path
    ├── schema.ts       its tables, when it has any, in the Postgres schema nano_<name>
    └── routes/         *.route.ts, mounted under the plugin's basePath
```

## Write a plugin

`@nano-app/backend` ships the plugin contract. A plugin is a `createPlugin` factory: options in, `PluginConfig` out. The app mounts only the plugins you list.

### A plugin in your app

```
src/
├── app.ts
└── plugins/
    └── hello/
        ├── index.ts
        └── routes/
            └── index.route.ts      →  /hello
```

```ts
// src/plugins/hello/index.ts
import { createPlugin } from '@nano-app/backend';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default createPlugin((options?: { basePath?: string }) => ({
  name: 'hello',
  basePath: options?.basePath ?? '/hello',
  stage: 'before',
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
}));
```

```ts
// src/plugins/hello/routes/index.route.ts
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async () => ({ result: { ok: true } }),
});
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';
import hello from './plugins/hello';

createNanoApp({ plugins: [hello()] });
```

`stage` is `"before"` (default) or `"after"` the app's own routes. Mount order: base middlewares, `before` plugins, your routes, `after` plugins, 404, error handler.

Set `options` in the returned config to pass values to the plugin's routes: every handler and callback receives them in `params`, next to `db`. Callbacks: `callbacks.onMount(app, params)` on the plugin, once, before its endpoints (app-level middlewares go here); `onInit(params)` and `onBefore(req, method, params)` on each route. See the [backend README](../backend/README.md#callbacks).

`routesDir` must be a real directory of `*.route.ts` files when you run the app from source (`tsx`). `jiti` loads them. There is no compile step for your routes.

### A plugin other people can install

Publish a separate package. Do not add it to this repository unless a maintainer has agreed to own it.

```json
{
  "name": "@you/nano-app-plugin-hello",
  "type": "module",
  "peerDependencies": {
    "@nano-app/backend": ">=0.11.0"
  },
  "license": "MIT"
}
```

Export the `createPlugin` factory as the package entry. The consumer installs both packages and passes the factory to `plugins`.

Use MIT or Apache-2.0 if you want the plugin listed from this repo later. Open an issue with the package name and a short description. A maintainer adds the link. The plugin stays in your repository.

### Database

Optional. Pass `database: { schema }` on the plugin config: the module of its Drizzle tables, with its `relations` when it has them. Its tables live in the Postgres schema `nano_<plugin name>`, which drizzle-kit creates when the module exports its `pgSchema`; a table elsewhere fails the startup.

Its tables are applied with drizzle-kit by whoever installs it, like the app's schema. Handlers and callbacks receive its client as `params.db`.

### What belongs in this repository

Pull requests to `backend/`, `core/`, `plugins/`, `frontend/` and `components/` are welcome. A pull request that adds `plugins/<name>` is not, until the maintainers ask for that plugin. Official plugins live in `plugins/<name>/`, are exported as `import <name> from '@nano-app/plugins/<name>'`, and `@nano-app/plugins` has its own version.
