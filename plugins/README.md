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
| `crud`   | `import crud from '@nano-app/plugins/crud'`     | On the models listed in `models` (any other answers 404): `GET` and `QUERY` on `/api/<model>{/<id>}` → a list `{ result, count }` or one record, with `QueryParams` as the body of `QUERY`; `POST /api/<model>`, `PUT` and `DELETE` on `/api/<model>/<id>` → the record created, updated or deleted. `<id>` takes the type of the model's id (`Int`, `BigInt` or `String`). With Better Auth, each method asks for a permission on the model: `read` (`GET`, `QUERY`), `create`, `update`, `delete`, and on the related models it reaches (see [crud and related models](#crud-and-related-models)) | `models` (the published ones), `basePath` (default `"/api"`)    |
| `rate-limit` | `import rateLimit from '@nano-app/plugins/rate-limit'` | None: limits every request of the routes and plugins mounted after it, per client IP (see [Client IP](../backend/README.md#client-ip)). Each request spends a token of the client's bucket, which holds `capacity` and refills `refillPerSecond` tokens per second; without one it answers `429` with `message` and `Retry-After` (seconds until the next token). List it first in `plugins`. The buckets live in the memory of each process | `capacity` (default `100`), `refillPerSecond` (default `1`), `message` |

What is not CRUD, such as creating a record with business logic, goes in a route of your own with its own URL: a route of yours on a `crud` URL takes every method of it.

### crud and related models

`crud` publishes the whole CRUD of each model in `models`; the limits are the app's, through the permissions of Better Auth. A request also reaches the models related to its model, and each of them needs its own permission:

- A read (`GET`, `QUERY`) needs `read` on every model its `expand`, `select`, `orderby` (`user.name`) and `filter` (also inside `AND`, `OR`, `NOT`, `some`, `every`, `none`, `is`, `isNot`) name.
- A write (`POST`, `PUT`) needs its own action on every model its data reaches through a relation: `{ "user": { "update": { "role": "admin" } } }` needs `update` on `user`.
- A model needs no place in `models` to be reached this way: its permission decides.

**Risk: Better Auth's models.** With Better Auth, `user`, `account`, `session` and `verification` live in the app's schema and are related to its models. A role with `read` on `account` or `session` reads, through any model related to the user (`expand: "user.accounts"`), the password hashes in `account.password`, the provider tokens and the session tokens; one with `update` on `user` changes roles through a nested write.

Keep them out of every role that calls `crud`: never grant `account`, `session` or `verification`, and grant `user` only to the roles that must see or change users. Better Auth's admin plugin gives the `user` role no `read` on them by default. To show some fields of a user, write a route of your own that selects only those fields.

### Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the plugin factory: the import path
    ├── schema.prisma   its tables, when it has any
    ├── migrations/     their migrations, applied at startup
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

Optional. Set `database: { enabled: true, schemaPath }` on the plugin config. The schema must be PostgreSQL. Schemas starting with `nano_` are reserved for the official plugins: a schema inside the `@nano-app/plugins` package declares only `nano_*` schemas, and every other schema declares none.

At startup nano-app generates the plugin's client in `.nano-app/prisma-clients/<name>` (again only when the schema changed) and checks that every model can be read.

- **A plugin of yours, or from another package:** its tables are applied with Prisma by whoever installs it, like the app's schema.
- **An official plugin:** nano-app also migrates it, so the consumer runs nothing. Its schema ships in `build/<name>/schema.prisma` with a `migrations/` folder next to it. At startup `prisma migrate deploy` applies the pending ones to the plugin's first `nano_*` schema, where its history (`_prisma_migrations`) lives apart from the app's. Each migration runs once, in a transaction, one instance at a time.

#### Migrations of an official plugin

- Every schema change ships its own `migrations/<timestamp>_<name>/migration.sql`, reviewed like code. A published migration is never edited.
- Migrations only add: tables, nullable columns or columns with a default, indexes. Dropping or renaming takes two releases: stop using it first, remove it later.
- The database user of the consumer needs to create tables in the plugin's `nano_*` schema.

Handlers and callbacks receive that client as `params.db`. Type it with `createRoute<{ db: PrismaClient }>`, passing your generated `PrismaClient`.

### What belongs in this repository

Pull requests to `backend/`, `core/`, `plugins/`, `frontend/` and `components/` are welcome. A pull request that adds `plugins/<name>` is not, until the maintainers ask for that plugin. Official plugins live in `plugins/<name>/`, are exported as `import <name> from '@nano-app/plugins/<name>'`, and `@nano-app/plugins` has its own version.
