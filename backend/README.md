# @nano-app/backend

[![backend](https://img.shields.io/npm/v/@nano-app/backend?label=backend)](https://www.npmjs.com/package/@nano-app/backend)

Preconfigured Express server with **file-convention routes** and **plugins**: it mounts the base middlewares, discovers your routes, formats every error as JSON, and groups extra endpoints in plugins.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer, or Bun 1.4.4 and newer (`bun src/app.ts`). ESM only.
- Optional PostgreSQL layer through Drizzle. Off by default: without it no database code is loaded.

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
  GET: async () => ({ result: { status: 'ok' } }),
});
```

```
[nano-app] [INFO] /
[nano-app] [INFO] /health
[nano-app] [INFO] /service/test

[nano-app] [INFO] Nano App running on port 3000
```

## Routes

Each `*.route.ts` under `routesDir` default-exports an object with the HTTP methods it implements (`GET`, `POST`, `PUT`, `DELETE`, `QUERY`). **The file path is the URL** (`index.route.ts` → `/`, `api/users.route.ts` → `/api/users`). A route file holds only those methods and its options (`expression`, `public`, `permissions`, `callbacks`): any other key, or an invalid value, stops the startup with the file and what is wrong. `expression` is appended to that path as is, in Express syntax (`/:id`, `{/:id}` for optional):

```ts
export default createRoute({
  expression: '/:id',                                  // → /users/:id
  GET:    async req => ({ result: { id: req.params.id } }),
  DELETE: async req => ({ message: 'Deleted' }),
});
```

Each handler receives `(req, params)` and returns an `ApiResponse` without `success`: its `status` is the HTTP status (`200` by default) and the framework sets `success` to `status < 400`. `params` holds the plugin's `options`, `db` (the Drizzle client when the app or the plugin has a database, see [Database](#database); a plugin without its own gets the app's) and `onBeforeResult` (see [Callbacks](#callbacks)):

```ts
type ApiResponse<T> = {
  status?: number;     // HTTP status, 200 by default; not sent in the body
  success?: boolean;   // set by the framework: status < 400
  result?: T;
  message?: string;
  warning?: boolean;
};
```

- A write returns the item as it is after it in `result`: `POST` the created item, `PUT` the updated item, `DELETE` the deleted item. The frontend keeps what an update returns.
- Undeclared methods respond `405`.
- An invalid file stops the startup with its path and what is wrong.

## Configuration

Every option is optional.

| Option | Default | Description |
|---|---|---|
| `port` | `3000` | Listening port. |
| `listener` | `() => {}` | Callback once the server is listening. |
| `settings` | `{ "trust proxy": <private networks> }` | Values for `app.set()`: see [Client IP](#client-ip). |
| `packages` | see below | Framework base middlewares. |
| `routesDir` | `"src/routes"` | Folder of your routes, relative to `cwd`. |
| `database` | none | Your Drizzle schema: see [Database](#database). |
| `auth` | none | Better Auth options: see [Better Auth](#better-auth). |
| `plugins` | `{}` | Plugins mounted `before` and `after` your routes, in order: see [Plugins](#plugins). |

`packages` accepts `morgan`, `cors`, `helmet`, `compression`, `express` (`express.json` options) and `urlencoded`. Each one you set replaces its default whole and the others keep theirs; pass `false` to disable one. `settings` works the same way, key by key.

`compression` is off by default: the proxy in front of the app (an ingress, nginx) usually compresses the answers. Turn it on with `packages: { compression: true }` when nothing does.

`morgan` writes a line per request to stdout, synchronously; with the access log of the proxy in front, `packages: { morgan: false }` saves that cost. It logs `:timestamp | :method :path :status` by default: `:path` is the path without its query string, so tokens sent there stay out of the logs. Set `format` with `:url` to log the full URL.

```ts
createNanoApp({
  packages: {
    cors: { origin: 'https://my-app.com' },
    helmet: false,
  },
});
```

### Client IP

The [`rate-limit` plugin](../plugins/README.md) and Better Auth count each client by its IP. Behind a proxy (the frontend of `@nano-app/frontend`, nginx, a load balancer, a CDN, Tailscale Funnel), the IP of the request is the proxy's: the client's is the last one the proxies appended to `X-Forwarded-For`.

By default the backend reads that header only when the request comes from loopback or a private network (`127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), and takes the last address that is not one of them. A request from a public IP is counted by that IP, whatever header it sends. Better Auth gets the same networks as `advanced.ipAddress.trustedProxies`.

- A public proxy in front (a CDN): set its addresses in `settings['trust proxy']` (any [Express value](https://expressjs.com/en/guide/behind-proxies.html)) and in Better Auth's `advanced.ipAddress.trustedProxies`.
- No proxy at all, or one you do not trust: `settings: { 'trust proxy': false }` and `advanced.ipAddress.trustedProxies: []`.
- Anything that can reach the backend from a private network can choose the IP it is counted by: keep the backend reachable only from its proxies.

## Database

Off until the app passes its schema: nano-app creates a [Drizzle](https://orm.drizzle.team) client of it on `DATABASE_URL` and passes it to your handlers as `db`. It changes your tables only when you ask: `push` or `migrations`. Without them, applying the schema (`drizzle-kit push`, `drizzle-kit generate` and `migrate`) is up to you.

```bash
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit
```

```ts
// src/db/schema.ts
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
});
```

```ts
// src/app.ts — DATABASE_URL comes from the environment (or a .env file)
import { createNanoApp } from '@nano-app/backend';
import * as schema from './db/schema';

createNanoApp({ database: { schema } });
```

```ts
// src/routes/users.route.ts
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async (_req, { db }) => ({ result: await db.query.users.findMany() }),
});
```

- `database.schema` is the module of your tables: every export that is a table, and `relations` (from `defineRelations`) when you relate them. A `pgSchema` the tables use is exported too, so drizzle-kit creates it.
- `database.push: true` applies the schema at startup with drizzle-kit's push (`pnpm add drizzle-kit`), only to the Postgres schemas of its tables. A change that would lose data stops the startup.
- `database.migrations` is the folder `drizzle-kit generate` writes: its pending migrations are applied at startup.
- One pool serves the app, Better Auth and every plugin with a database. It connects on its first query: a missing table fails that query, not the startup.
- Startup fails if `DATABASE_URL` is missing.
- Each `nano_*` Postgres schema is reserved for the plugin of its name (`nano_auth` for Better Auth): a table of yours in one fails the startup.
- Without a database, `db` is `undefined`.
- Drizzle and pg are loaded only when your database or a mounted plugin's is on.

## Better Auth

Users, sign-in and sessions with [Better Auth](https://www.better-auth.com). On when `createNanoApp` has `auth`: its options, everything but `database`. Without it, it stays off.

```bash
pnpm add better-auth kysely pg
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';

createNanoApp({ auth: { emailAndPassword: { enabled: true } } });
```

- It uses the pool of `DATABASE_URL`, with or without a database of the app: startup fails if it is missing.
- Its tables live in the Postgres schema `nano_auth`. nano-app creates them at startup with Better Auth's migrations, and adds what new options need; it never drops anything.
- Its endpoints are mounted before your routes, at its `basePath` (default `/api/auth`), and stay public.
- In production, Better Auth limits sign-in, sign-up and password reset to a few attempts per client IP (its `rateLimit`): see [Client IP](#client-ip).
- With it on, every route of the app and of every plugin needs a session: without one it answers 401 `Not authenticated`.
- `createRoute({ public: true, ... })` answers without a session. An unknown path answers 404.
- Handlers and `onBefore` receive the session in `params.session` (`{ user, session }`), also on a public route when the request has one.
- The middlewares a plugin adds with `app.use` in `onMount` are not checked: a plugin that exposes something public says it in its README.
- Sign-up works as Better Auth sets it: with `emailAndPassword` anyone can sign up and reach your routes. Close it with `disableSignUp: true`, or check roles in your handlers.
- Extra user fields go in its `user.additionalFields`.
- Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in the environment, as Better Auth asks.
- Better Auth is loaded only when it is on, and nano-app creates the one instance the app uses.
- Before 0.19.0 the options went in the default export of `src/auth.ts` and its tables in your schema: move the options to `auth`.

### Permissions

A route asks for permissions of Better Auth's [admin plugin](https://www.better-auth.com/docs/plugins/admin): add `admin()` to the `plugins` of your options, with your roles (`ac` and `roles`). A user without them gets 403:

```ts
export default createRoute({
  permissions: { notes: ['read'] },
  GET: async (_req, { db }) => ({ result: await db.note.findMany() }),
});
```

A method may ask for its own permissions instead of the route's: `POST: { handler, permissions: { notes: ['create'] } }`. A plain function takes those of the route. Without any, a session is enough. In a handler of your own, `isGranted(params.session, permissions)` asks Better Auth the same.

A public route does not check them. Without Better Auth the route answers anyway, with a warning at startup. The params of handlers and callbacks are read-only.

## Plugins

A plugin is a group of endpoints mounted under a base path. Your routes are mounted as one (named `app`). The official plugins are in [`@nano-app/plugins`](https://github.com/Nano-Nathan/nano-app/blob/main/plugins/README.md). You write one with `createPlugin` and list it in `plugins.before` or `plugins.after`. Nothing is mounted unless you list it.

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
  GET: async () => ({ result: { ok: true } }),
});
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';
import hello from './plugins/hello';

createNanoApp({ plugins: { before: [hello()] } });
```

`createPlugin` types the options of that plugin. Each plugin chooses its base path; the app chooses whether it mounts `before` or `after` its routes. What the plugin puts in `options` reaches every callback and handler of its routes in `params`.

### Callbacks

Two levels. Only the plugin's receives the Express app, so nothing app-wide depends on the order of the route files.

| Level | Callback | Runs | Receives | Use |
|---|---|---|---|---|
| Plugin (`callbacks` in its config) | `onMount` | Once, after its database and before its endpoints | `(app, params)` | App-level middlewares (a guard), shared setup |
| Endpoint (`callbacks` in `createRoute`) | `onInit` | Once, when the endpoint is mounted | `(params)` | Setup of that route |
| Endpoint | `onBefore` | Before every request the endpoint handles | `(req, method, params)` | Validate or load; its return value reaches the handler as `params.onBeforeResult` (`{}` without `onBefore`) |

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

The endpoints of one plugin have no guaranteed order: one route's `onInit` must not depend on another's.

Everything is mounted on one Express application, in this order: base middlewares → Better Auth → `before` plugins → your routes → `after` plugins → 404 → error handler.

A plugin with a database passes its own `database` (`schema`, `push`, `migrations`, as the app's). Only it may keep tables in the Postgres schema `nano_<its name>`: a table in the `nano_*` schema of another fails the startup. Without a database of its own, a plugin receives the app's `db`. See [`@nano-app/plugins`](https://github.com/Nano-Nathan/nano-app/blob/main/plugins/README.md#database).

## Errors

The framework mounts the 404 and the error handler: an unmatched request becomes a `404`, and anything a handler throws becomes an `ApiResponse`.

```ts
throw { status: 409, message: 'Already exists' };   // → 409 { success: false, warning: false, message: "Already exists" }
throw 'Field name is required';                     // → 400 { success: false, warning: false, message: "Field name is required" }
throw new Error('boom');                            // → 500 "Internal server error", logged to stderr
// A Postgres error is one more Error: 500. Catch it in your handler to answer a 409
GET /unknown                                        // → 404 { success: false, warning: false, message: "/unknown not found" }
```

## Typed creators

| Function | Purpose |
|---|---|
| `createNanoApp(config?)` | Creates and starts the app. |
| `createRoute(route)` | Types a route file. |
| `createPlugin(creator)` | Types a plugin factory and its options. |
| `createPluginCallbacks(callbacks)` | Types the callbacks of a plugin (`createPluginCallbacks<{ db: MyDb }>` types `db`), e.g. to keep them in their own file. |

Also exported: the `NanoApp` class that `createNanoApp` returns, the configuration types (`NanoAppConfig`, `PackagesConfig`, `PluginConfig`, `PluginStage`, `MainPluginConfig`, `DatabaseConfig`), the Express `Request` type and the HTTP contract (`ApiResponse`, `ApiPromise`, `QueryParams`, `RouteEntry`, `Handler`, `HandlerParams`, `Handlers`, `NanoObject`) and the callback types (`Params`, `Callbacks`, `PluginCallbacks`).

## Development

```bash
pnpm build     # tsdown → build/ (ESM + .d.ts)
pnpm dev       # tsdown --watch
pnpm test      # node:test against the real server (tsx --test)
DATABASE_URL=postgres://… pnpm test   # also runs the PostgreSQL suite
```

## License

MIT — Cristian Serrano.
