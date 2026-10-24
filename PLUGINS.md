# Plugins

`@nano-app/backend` ships the plugin contract. The official plugins are in [`@nano-app/plugins`](plugins/README.md). A plugin is a `createPlugin` factory: options in, `PluginConfig` out. The app mounts only the plugins you list.

## A plugin in your app

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
import { createPlugin } from "@nano-app/backend";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default createPlugin((options?: { basePath?: string }) => ({
  name: "hello",
  basePath: options?.basePath ?? "/hello",
  stage: "before",
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), "routes"),
}));
```

```ts
// src/plugins/hello/routes/index.route.ts
import { createRoute } from "@nano-app/backend";

export default createRoute({
  GET: async () => ({ success: true, result: { ok: true } }),
});
```

```ts
// src/app.ts
import { createNanoApp } from "@nano-app/backend";
import hello from "./plugins/hello";

createNanoApp({ plugins: [hello()] });
```

`stage` is `"before"` (default) or `"after"` the app's own routes. Mount order: base middlewares, `before` plugins, your routes, `after` plugins, 404, error handler.

Set `options` in the returned config to pass values to the plugin's routes: every handler and callback receives them in `params`, next to `db`. Callbacks: `callbacks.onMount(app, params)` on the plugin, once, before its endpoints (app-level middlewares go here); `onInit(params)` and `onBefore(req, method, params)` on each route. See the [backend README](backend/README.md#callbacks).

`routesDir` must be a real directory of `*.route.ts` files when you run the app from source (`tsx`). `jiti` loads them. There is no compile step for your routes.

## A plugin other people can install

Publish a separate package. Do not add it to this repository unless a maintainer has agreed to own it.

```json
{
  "name": "@you/nano-app-plugin-hello",
  "type": "module",
  "peerDependencies": {
    "@nano-app/backend": "^0.7.0"
  },
  "license": "MIT"
}
```

Export the `createPlugin` factory as the package entry. The consumer installs both packages and passes the factory to `plugins`.

Use MIT or Apache-2.0 if you want the plugin listed from this repo later. Open an issue with the package name and a short description. A maintainer adds the link. The plugin stays in your repository.

## Database

Optional. Set `database: { enabled: true, schemaPath }` on the plugin config. The schema must be PostgreSQL. Schemas starting with `nano_` are reserved for the official plugins: a schema inside the `@nano-app/plugins` package declares only `nano_*` schemas, and every other schema declares none.

At startup nano-app generates the plugin's client in `.nano-app/prisma-clients/<name>` (again only when the schema changed) and checks that every model can be read.

- **A plugin of yours, or from another package:** its tables are applied with Prisma by whoever installs it, like the app's schema.
- **An official plugin:** nano-app also migrates it, so the consumer runs nothing. Its schema ships in `build/<name>/schema.prisma` with a `migrations/` folder next to it. At startup `prisma migrate deploy` applies the pending ones to the plugin's first `nano_*` schema, where its history (`_prisma_migrations`) lives apart from the app's. Each migration runs once, in a transaction, one instance at a time.

### Migrations of an official plugin

- Every schema change ships its own `migrations/<timestamp>_<name>/migration.sql`, reviewed like code. A published migration is never edited.
- Migrations only add: tables, nullable columns or columns with a default, indexes. Dropping or renaming takes two releases: stop using it first, remove it later.
- The database user of the consumer needs to create tables in the plugin's `nano_*` schema.

Handlers and callbacks receive that client as `params.db`. Type it with `createRoute<PrismaClient>`, passing your generated `PrismaClient`.

## What belongs in this repository

Pull requests to `backend/`, `core/` and `plugins/` are welcome. A pull request that adds `plugins/<name>` is not, until the maintainers ask for that plugin. Official plugins live in `plugins/<name>/`, are exported as `import <name> from "@nano-app/plugins/<name>"`, and `@nano-app/plugins` has its own version.
