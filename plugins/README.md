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
| `auth` | `import auth from "@nano-app/plugins/auth"` | [Better Auth](https://www.better-auth.com/docs) under `/auth/*`, and a guard on every route after it | see [auth](#auth) |

## auth

[Better Auth](https://www.better-auth.com/docs) with a database, an admin user and a guard. Its client is Better Auth's own (`better-auth/react`).

```ts
// src/auth.ts: the migration command reads the plugin from here
import auth from "@nano-app/plugins/auth";

export default auth({
  publicPaths: ["/webhooks/telegram"],
  betterAuth: { socialProviders: { github: { clientId: "…", clientSecret: "…" } } },
});
```

```ts
// src/app.ts
import { createNanoApp } from "@nano-app/backend";
import health from "@nano-app/plugins/health";
import authPlugin from "./auth";

// health is listed before auth: it stays public
createNanoApp({ plugins: [health(), authPlugin] });
```

| Option | Default | |
|---|---|---|
| `basePath` | `"/auth"` | Base path of the Better Auth endpoints |
| `publicPaths` | `[]` | Exact paths the guard lets through |
| `betterAuth` | `{}` | [Better Auth options](https://www.better-auth.com/docs/reference/options), except `database`, `basePath`, `emailAndPassword` and `plugins`: the plugin sets them |

### Environment

| Variable | |
|---|---|
| `DATABASE_URL` | PostgreSQL, direct connection. The tables live in its `nano_auth` schema |
| `BETTER_AUTH_SECRET` | Signs sessions and cookies. Required in production |
| `BETTER_AUTH_URL` | Public URL of the app, as the browser sees it (cookies, redirects, origin check) |

### Migrations

Manual, never at startup. The startup only checks them: if the schema or a table is missing, the app does not start and says what to run.

```bash
pnpm exec nano-app-auth migrate [file]   # file default-exports auth({ … }); defaults to src/auth.ts
```

It creates the `nano_auth` schema and the tables Better Auth needs. It never drops anything.

### What the plugin sets

- `database`: a `pg` pool on `DATABASE_URL` with `search_path=nano_auth`.
- `emailAndPassword`: enabled, sign-up disabled. The admin creates the users.
- Better Auth plugins `admin` (roles, user management), `username` (sign in with a username) and `apiKey` with `enableSessionForAPIKeys`.
- A user field `mustChangePassword`.

### Admin user

The first startup creates the user `admin` (role `admin`) with the password `admin1234` and `mustChangePassword: true`. Its first sign-in (`POST /auth/sign-in/username`) has to change it (`POST /auth/change-password`). Until then every other request of that session answers 403, Better Auth's endpoints included, and every startup warns.

### Guard

Mounted after the Better Auth handler. It covers every route mounted after the plugin: the app routes and the plugins listed after it. It accepts a session cookie or an API key in `x-api-key`.

| Request | Answer |
|---|---|
| Path in `publicPaths`, or served before the guard | passes |
| No session and no API key | 401 |
| Session of a user with `mustChangePassword` | 403 |
| Invalid API key | Better Auth's status (403) |
| Valid session or API key | passes |

## Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the plugin factory: the import path
    ├── cli.ts          its command, when it has one (`nano-app-<name>`)
    └── routes/         *.route.ts, mounted under the plugin's basePath
```

The plugin contract: [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).
