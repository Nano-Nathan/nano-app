# @nano-app/backend

[![backend](https://img.shields.io/npm/v/@nano-app/backend?label=backend)](https://www.npmjs.com/package/@nano-app/backend)

Preconfigured Express server with **file-convention routes** and **plugins**: it mounts the base middlewares, discovers your routes, formats every error as JSON, and groups extra endpoints in plugins.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- Optional PostgreSQL layer through your generated Prisma client. Disabled by default: without it no database code is loaded.

```bash
pnpm add @nano-app/backend
```

## Quick start

```
src/
├── app.ts
└── routes/
    ├── index.route.ts          → /
    ├── health.route.ts         → /health
    └── service/test.route.ts   → /service/test
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
  GET: async () => ({ success: true, result: { status: 'ok' } }),
});
```

```
[nano-app] [INFO] /
[nano-app] [INFO] /health
[nano-app] [INFO] /service/test

[nano-app] [INFO] Nano App running on port 3000
```

## Routes

Each `*.route.ts` under `mainPlugin.routesDir` default-exports an object with the HTTP methods it implements (`GET`, `POST`, `PUT`, `DELETE`, `QUERY`). **The file path is the URL** (`index.route.ts` → `/`, `api/users.route.ts` → `/api/users`). `expression` is appended to that path as is, in Express syntax (`/:id`, `{/:id}` for optional):

```ts
export default createRoute({
  expression: '/:id',                                  // → /users/:id
  GET:    async req => ({ success: true, result: { id: req.params.id } }),
  DELETE: async req => ({ success: true, message: 'Deleted' }),
});
```

Each handler receives `(req, params)` and returns an `ApiResponse`. `params` holds the plugin's `options`, `db` (the Prisma client when a database is enabled, see [Database](#database)) and `onBeforeResult` (see [Callbacks](#callbacks)):

```ts
type ApiResponse<T> = {
  success?: boolean;   // true → HTTP 200, any other value → HTTP 400
  result?: T;
  message?: string;
  warning?: boolean;
};
```

- A write returns the item as it is after it in `result`: `POST` the created item, `PUT` the updated item, `DELETE` the deleted item. The frontend keeps what an update returns.
- Undeclared methods respond `405`.
- An invalid file is discarded with a warning; the other routes keep working.

## Configuration

Every option is optional.

| Option | Default | Description |
|---|---|---|
| `port` | `3000` | Listening port. |
| `listener` | `() => {}` | Callback once the server is listening. |
| `settings` | `{}` | Values for `app.set()` (e.g. `{ "trust proxy": 1 }`). |
| `packages` | see below | Framework base middlewares. |
| `mainPlugin` | `{ routesDir: "src/routes" }` | Your routes (`routesDir`, relative to `cwd`), `basePath` (e.g. `/api`, no trailing slash) and database: see [Database](#database). |
| `plugins` | `[]` | Plugins mounted around your routes, in order: see [Plugins](#plugins). |

`packages` accepts `morgan`, `cors`, `helmet`, `compression`, `rateLimit`, `express` (`express.json` options), `urlencoded` and `betterAuth` (off by default: see [Better Auth](#better-auth)). The merge is **per section**: passing one key keeps the others; pass `false`/`undefined` to disable one.

```ts
createNanoApp({
  settings: { 'trust proxy': 1 },
  packages: {
    cors: { origin: 'https://my-app.com' },
    helmet: false,
    rateLimit: { windowMs: 60_000, max: 120 },
  },
});
```

## Database

Off until enabled: at startup nano-app generates the Prisma client of your schema, checks that its tables can be read and passes it to your handlers as their second parameter. **It never modifies your database**: applying the schema (`prisma db push`, `prisma migrate dev`, `prisma migrate deploy`) is up to you, with Prisma.

```bash
pnpm add prisma @prisma/client @prisma/adapter-pg pg   # prisma too: the startup generates the client
```

```prisma
// src/prisma/schema.prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "./client"   // any value: nano-app generates in .nano-app/prisma-clients/app
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

```ts
// src/app.ts — DATABASE_URL comes from the environment (or a .env file)
createNanoApp({ mainPlugin: { database: { enabled: true } } });
```

```ts
// src/routes/users.route.ts
import { createRoute } from '@nano-app/backend';
import type { PrismaClient } from '../../.nano-app/prisma-clients/app/generated/client';

export default createRoute<PrismaClient>({
  GET: async (_req, { db }) => ({ success: true, result: await db!.user.findMany() }),
});
```

| Option | Default | Description |
|---|---|---|
| `mainPlugin.database.enabled` | `false` | Generates and mounts your client at startup. |
| `mainPlugin.database.schemaPath` | `"src/prisma/schema.prisma"` | Your single `.prisma` file; its datasource must be `postgresql`. |

- Each key falls back to its default, so `{ enabled: true }` is enough with the default layout.
- The client lives in `.nano-app/prisma-clients/app/` (add `.nano-app/` to `.gitignore`). It is generated again only when the schema changes. Do not run `prisma generate`: a second client would be out of sync.
- The client exists after the first startup: start the app once before your editor or `tsc` can import its types. In a container, `.nano-app/` must be writable.
- Startup fails if `DATABASE_URL` is missing, the schema is not a valid PostgreSQL schema, or a table or column of a model cannot be read. The message says which: apply your schema with Prisma and start again.
- The `nano_` prefix is reserved for the official plugins (`@nano-app/plugins`): a datasource schema of yours starting with it fails the startup.
- Pass your generated `PrismaClient` to `createRoute<PrismaClient>` to type `db`; otherwise it is `any`, and without an enabled database `undefined`.
- For several PostgreSQL schemas, declare `schemas = ["public", "billing"]` in the datasource and `@@schema("billing")` on each model; one client covers them all.
- Prisma is loaded only when your database or a mounted plugin's is enabled.

## Better Auth

Users, sign-in and sessions with [Better Auth](https://www.better-auth.com), on your database. Off until `packages.betterAuth` gets its options (everything but `database`: nano-app passes your Prisma client).

```bash
pnpm add better-auth
```

```ts
// src/auth.ts: the options, and an instance only for the Better Auth CLI
import { betterAuth, type BetterAuthOptions } from 'better-auth';

export const authOptions = { emailAndPassword: { enabled: true } } satisfies BetterAuthOptions;
export const auth = betterAuth(authOptions);
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';
import { authOptions } from './auth';

createNanoApp({
  packages: { betterAuth: authOptions },
  mainPlugin: { database: { enabled: true } },
});
```

Its tables are yours, like the rest of your schema. Add its models with its CLI, then apply them with Prisma; run both again when you change the options:

```bash
npx auth generate --config src/auth.ts --adapter prisma --dialect postgresql --output src/prisma/schema.prisma
npx prisma migrate dev
```

- It needs the database: `packages.betterAuth` without `mainPlugin.database.enabled` fails at startup.
- Startup also fails if your schema lacks a model the options need (`user`, `session`, ...), naming them.
- Its endpoints are mounted with your routes, at its `basePath` (default `/api/auth`), and stay public.
- Every route of yours and of the `after` plugins needs a session: without one, 401. The `before` plugins stay public (a landing, an about page).
- Handlers and `onBefore` receive the session in `params.session` (`{ user, session }`).
- Sign-up works as Better Auth sets it: with `emailAndPassword` anyone can sign up and reach your routes. Close it with `disableSignUp: true`, or check roles in your handlers.
- Relate your models to `User` in the same schema, as any Prisma relation. Extra user fields go in its `user.additionalFields`.
- With several PostgreSQL schemas, add `@@schema(...)` to the generated models.
- Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in the environment, as Better Auth asks.
- Better Auth is loaded only when it is on.

## Plugins

A plugin is a group of endpoints mounted under a base path. Your routes are mounted as one (named `app`). The official plugins are in [`@nano-app/plugins`](https://github.com/Nano-Nathan/nano-app/blob/main/plugins/README.md). You write one with `createPlugin` and list it in `plugins`. Nothing is mounted unless you list it. Official plugins that have tables ship their own migrations: nano-app applies them at startup, each in its `nano_*` schema. That is the only change it makes to your database.

```ts
// src/plugins/hello/index.ts
import { createPlugin } from '@nano-app/backend';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default createPlugin((options?: { basePath?: string }) => ({
  name: 'hello',
  basePath: options?.basePath ?? '/hello',
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
}));
```

```ts
// src/plugins/hello/routes/index.route.ts  →  /hello
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async () => ({ success: true, result: { ok: true } }),
});
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';
import hello from './plugins/hello';

createNanoApp({ plugins: [hello()] });
```

`createPlugin` types the options of that plugin. Each plugin chooses its base path and whether it mounts `before` (default) or `after` your routes. What the plugin puts in `options` reaches every callback and handler of its routes in `params`.

### Callbacks

Two levels. Only the plugin's receives the Express app, so nothing app-wide depends on the order of the route files.

| Level | Callback | Runs | Receives | Use |
|---|---|---|---|---|
| Plugin (`callbacks` in its config) | `onMount` | Once, after its database and before its endpoints | `(app, params)` | App-level middlewares (a guard), shared setup |
| Endpoint (`callbacks` in `createRoute`) | `onInit` | Once, when the endpoint is mounted | `(params)` | Setup of that route |
| Endpoint | `onBefore` | Before every request the endpoint handles | `(req, method, params)` | Validate or load; its return value reaches the handler as `params.onBeforeResult` |

```ts
export default createPlugin((options?: { publicPaths?: string[] }) => ({
  name: 'guard',
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
  options: { publicPaths: options?.publicPaths ?? [] },
  callbacks: {
    onMount: async (app, { publicPaths }) => {
      app.use((req, _res, next) => next(publicPaths.includes(req.path) ? undefined : { status: 401, message: 'Unauthorized' }));
    },
  },
}));
```

The endpoints of one plugin have no guaranteed order: one route's `onInit` must not depend on another's. `mainPlugin` takes `callbacks` too.

Everything is mounted on one Express application, in this order: base middlewares → `before` plugins → your routes → `after` plugins → 404 → error handler.

A plugin with a database follows the same rules, with its client in `.nano-app/prisma-clients/<name>`: a plugin of yours points `database.schemaPath` at its schema and you apply it with Prisma. If that folder holds the client of another schema (another plugin with the same name), the startup warns and replaces it. An official plugin of `@nano-app/plugins` needs nothing from you: at startup nano-app applies its migrations to its own `nano_*` schema. See [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).

## Errors

The framework mounts the 404 and the error handler: an unmatched request becomes a `404`, and anything a handler throws becomes an `ApiResponse`.

```ts
throw { status: 409, message: 'Already exists' };   // → 409 { success: false, warning: false, message: "Already exists" }
throw 'Field name is required';                     // → 400 { success: false, message: "Field name is required" }
throw new Error('boom');                            // → 500, logged to stderr
GET /unknown                                        // → 404 { success: false, warning: false, message: "/unknown not found" }
```

## Typed creators

| Function | Purpose |
|---|---|
| `createNanoApp(config?)` | Creates and starts the app. |
| `createRoute(route)` | Types a route file. |
| `createPlugin(creator)` | Types a plugin factory and its options. |
| `createPluginCallbacks(callbacks)` | Types the callbacks of a plugin (`createPluginCallbacks<PrismaClient>` types `db`), e.g. to keep them in their own file. |

Also exported: the `NanoApp` class that `createNanoApp` returns, the configuration types (`NanoAppConfig`, `PackagesConfig`, `PluginConfig`, `PluginCreator`, `PluginStage`, `MainPluginConfig`, `DatabaseConfig`), the Express `Request` type and the HTTP contract (`ApiResponse`, `ApiPromise`, `QueryParams`, `RouteEntry`, `Handler`, `Handlers`, `NanoObject`) and the callback types (`Params`, `Callbacks`, `PluginCallbacks`).

## Development

```bash
pnpm build     # tsdown → build/ (ESM + .d.ts)
pnpm dev       # tsdown --watch
pnpm test      # node:test against the real server (tsx --test)
DATABASE_URL=postgres://… pnpm test   # also runs the PostgreSQL suite
```

## License

MIT — Cristian Serrano.
