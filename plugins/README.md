# @nano-app/plugins

Official plugins for [`@nano-app/backend`](https://www.npmjs.com/package/@nano-app/backend). One import path per plugin: `@nano-app/plugins/<name>`. Nothing is mounted unless you list it.

```bash
npm install @nano-app/backend @nano-app/plugins
```

```ts
import { createNanoApp } from "@nano-app/backend";
import health from "@nano-app/plugins/health";

createNanoApp({ plugins: [health()] });
```

## Plugins

| Plugin | Import | Endpoints | Options |
|---|---|---|---|
| `health` | `import health from "@nano-app/plugins/health"` | `GET /health` → `{ status: "ok" }` | `basePath` (default `"/health"`) |
| `auth` | `import auth from "@nano-app/plugins/auth"` | `/api-keys`, and an API key guard on every route after it | see [auth](#auth) |

## auth

API keys. Every route mounted after the plugin needs a valid key in the `x-api-key` header; the routes of the plugins listed before it and `publicPaths` stay public. The keys are managed with the master key, created on the first startup.

```ts
import { createNanoApp } from "@nano-app/backend";
import health from "@nano-app/plugins/health";
import auth from "@nano-app/plugins/auth";

// health is listed before auth: it stays public
createNanoApp({ plugins: [health(), auth({ publicPaths: ["/webhooks/telegram"] })] });
```

| Option | Default | |
|---|---|---|
| `basePath` | `"/api-keys"` | Base path of the endpoints that manage the keys |
| `publicPaths` | `[]` | Exact paths that need no key |

### Table

The keys live in `nano_auth.api_key`, through the app's Prisma (`DATABASE_URL`). Only the SHA-256 of each key is stored. nano-app creates and migrates the table at startup: there is nothing to run.

### Master key

The first startup creates it and prints it **once** in the console: keep it. A unique index allows a single master, also when several instances start together. It cannot be deleted. If it is lost, delete its row (`isMaster = true`) and restart: a new one is created and printed.

### Endpoints

Only the master key reaches them (403 with any other key).

| Request | Answer |
|---|---|
| `GET /api-keys` | The keys: `id`, `name`, `isMaster`, `createdAt`. Never the key |
| `POST /api-keys` `{ name }` | A new key, with its `key` only in this response |
| `DELETE /api-keys/:id` | Deletes it; it stops working at once. 403 on the master |
| `POST /api-keys/:id/renew` | Same id, a new `key`; the old one stops working at once |
| `POST /api-keys/master/renew` | Renews the master |

### Guard

| Request | Answer |
|---|---|
| Path in `publicPaths`, or served before the plugin | passes |
| No key, or a key that does not exist | 401 |
| Any valid key, the master included | passes |

## Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the plugin factory: the import path
    ├── schema.prisma   its tables, when it has any
    ├── migrations/     their migrations, applied at startup
    └── routes/         *.route.ts, mounted under the plugin's basePath
```

The plugin contract: [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).
