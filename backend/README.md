# @nano-app/backend

Preconfigured Express server with **file-convention routes** and **plugins**: it mounts the base middlewares, discovers your routes, formats every error as JSON, and groups extra endpoints in plugins.

- Node ≥ 20, ESM.
- Optional PostgreSQL layer through your generated Prisma client. Disabled by default: without it no database code is loaded.

```bash
npm install @nano-app/backend
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

```
[nano-app] [INFO] /
[nano-app] [INFO] /health
[nano-app] [INFO] /service/test

[nano-app] [INFO] Nano App running on port 3000
```

## Routes

Each `*.route.ts` under `mainPlugin.routesDir` default-exports an object with the HTTP methods it implements. **The file path is the URL** (`index.route.ts` → `/`, `api/users.route.ts` → `/api/users`). `expression` adds parameters:

```ts
export default createRoute({
  expression: ":id",                                   // → /users/:id
  GET:    async req => ({ success: true, result: { id: req.params.id } }),
  DELETE: async req => ({ success: true, message: "Deleted" }),
});
```

Each handler receives `(req, db)` — `db` is the Prisma client when a database is enabled ([Database](#database)) — and returns an `ApiResponse`:

```ts
type ApiResponse<T> = {
  success?: boolean;   // true → HTTP 200, any other value → HTTP 400
  result?: T;
  message?: string;
  warning?: boolean;
};
```

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
| `mainPlugin` | `{ routesDir: "src/routes", basePath: "/" }` | Your routes (`routesDir`, relative to `cwd`), `basePath`, `init` and database: see [Database](#database). |
| `plugins` | `[]` | Plugins mounted around your routes, in order: see [Plugins](#plugins). |

`packages` accepts `morgan`, `cors`, `helmet`, `compression`, `rateLimit`, `express` (`express.json` options) and `urlencoded`. The merge is **per section**: passing one key keeps the others; pass `false`/`undefined` to disable one.

```ts
createNanoApp({
  settings: { "trust proxy": 1 },
  packages: {
    cors: { origin: "https://my-app.com" },
    helmet: false,
    rateLimit: { windowMs: 60_000, max: 120 },
  },
});
```

## Database

Off until enabled: it loads the Prisma client you generated and passes it to your handlers as their second parameter. **It never modifies your database**: generating the client and migrating are up to you, with the Prisma CLI.

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma
```

```prisma
// src/prisma/schema.prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "./client"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

```bash
npx nano-app generate              # client in .nano-app/prisma-clients/app (add .nano-app/ to .gitignore)
npx nano-app push                  # generate + prisma db push; or any Prisma command: npx nano-app migrate dev …
```

```ts
// src/app.ts — DATABASE_URL comes from the environment (or a .env file)
createNanoApp({ mainPlugin: { database: { enabled: true } } });
```

```ts
// src/routes/users.route.ts
import { createRoute } from "@nano-app/backend";
import type { PrismaClient } from "../../.nano-app/prisma-clients/app/generated/client";

export default createRoute({
  GET: async (_req, db: PrismaClient) => ({ success: true, result: await db.user.findMany() }),
});
```

| Option | Default | Description |
|---|---|---|
| `mainPlugin.database.enabled` | `false` | Mounts your client at startup. |
| `mainPlugin.database.schemaPath` | `"src/prisma/schema.prisma"` | The single `.prisma` file the client was generated from; its datasource must be `postgresql`. |

- Each key falls back to its default, so `{ enabled: true }` is enough with the default layout. The client is always read from `.nano-app/prisma-clients/app/`, where `nano-app generate` writes it.
- Startup fails if `DATABASE_URL` is missing or the client cannot be loaded or is not a valid PostgreSQL Prisma client. The connection opens on the first query.
- The `nano_` prefix is reserved for the framework's plugins: a datasource schema starting with it fails the startup.
- Annotate `db` with your generated `PrismaClient` to type it; otherwise it is `any`, and without an enabled database `undefined`.
- For several PostgreSQL schemas, declare `schemas = ["public", "billing"]` in the datasource and `@@schema("billing")` on each model; one client covers them all.

## Plugins

A plugin is a group of endpoints mounted under a base path. Your routes are mounted as one (named `app`). This package ships no official plugin. You write one with `createPlugin` and list it in `plugins`. Nothing is mounted unless you list it.

```ts
// src/plugins/hello/index.ts
import { createPlugin } from "@nano-app/backend";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default createPlugin((options?: { basePath?: string }) => ({
  name: "hello",
  basePath: options?.basePath ?? "/hello",
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), "routes"),
}));
```

```ts
// src/plugins/hello/routes/index.route.ts  →  /hello
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

`createPlugin` types the options of that plugin. Each plugin chooses its base path and whether it mounts `before` (default) or `after` your routes.

Everything is mounted on one Express application, in this order: base middlewares → `before` plugins → your routes → `after` plugins → 404 → error handler.

A plugin with its own Prisma schema is generated by name. `nano-app generate <name>` reads `plugins/<name>/schema.prisma` from this package when the plugin ships inside it. A plugin you keep in your app points `database.schemaPath` at your own file and you generate that client yourself. See [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).

```bash
npx nano-app generate            # the app schema (src/prisma/schema.prisma) → .nano-app/prisma-clients/app
npx nano-app push                # generate + prisma db push
```

## Errors

The framework mounts the 404 and the error handler: an unmatched request becomes a `404`, and anything a handler throws becomes an `ApiResponse`.

```ts
throw { status: 409, message: "Already exists" };   // → 409 { success: false, warning: false, message: "Already exists" }
throw "Field name is required";                     // → 400 { success: false, message: "Field name is required" }
throw new Error("boom");                            // → 500, logged to stderr
GET /unknown                                        // → 404 { success: false, warning: false, message: "/unknown not found" }
```

## Typed creators

| Function | Purpose |
|---|---|
| `createNanoApp(config?)` | Creates and starts the app. |
| `createRoute(route)` | Types a route file. |
| `createPlugin(creator)` | Types a plugin factory and its options. |

Also exported: the configuration types (`NanoAppConfig`, `PackagesConfig`, `PluginConfig`, `PluginStage`, `MainPluginConfig`, `DatabaseConfig`), the Express `Request` type and the HTTP contract (`ApiResponse`, `ApiPromise`, `QueryParams`, `RouteEntry`, `Handler`, `Handlers`, `NanoObject`).

## Development

```bash
pnpm build     # tsup → build/ (ESM + .d.ts)
pnpm dev       # tsup --watch
pnpm test      # node:test against the real server (tsx --test)
DATABASE_URL=postgres://… pnpm test   # also runs the PostgreSQL suite
```

## License

MIT — Cristian Serrano.
