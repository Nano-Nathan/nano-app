# @nano-app/backend

The Express 5 server: file routes, plugins, PostgreSQL through Drizzle and Better Auth.

```bash
pnpm add @nano-app/backend
```

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer, or Bun 1.4.4 and newer (`bun src/app.ts`). ESM only.
- Drizzle, `pg` and Better Auth are optional and loaded only when turned on.

## Exports

| Export                             | Purpose                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `createNanoApp(config?)`           | Creates and starts the app.                                                         |
| `createRoute(route)`               | Types a route file.                                                                 |
| `createPlugin(creator)`            | Types a plugin factory and its options.                                             |
| `createPluginCallbacks(callbacks)` | Types the callbacks of a plugin (`createPluginCallbacks<{ db: MyDb }>` types `db`). |
| `NanoError`                        | The error type.                                                                     |

Types: `Request` (Express), `ApiResponse`, `ApiPromise`, `RouteEntry`, `HandlerParams`, `NanoObject`, `PluginConfig`, `PluginOptions`, `PluginCallbacks`.

## createNanoApp

```ts
createNanoApp({ port: 3000, routesDir: 'src/routes' });
```

Every option is optional.

| Option      | Default                                 | Description                                                                          |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `port`      | `3000`                                  | Listening port.                                                                      |
| `listener`  | `() => {}`                              | Called once the server is listening.                                                 |
| `settings`  | `{ "trust proxy": <private networks> }` | Values for `app.set()`, key by key. See [Client IP](#client-ip).                     |
| `packages`  | see [packages](#packages)               | The base middlewares.                                                                |
| `routesDir` | `"src/routes"`                          | Folder of your routes, relative to `cwd`.                                            |
| `database`  | none                                    | See [database](#database).                                                           |
| `auth`      | none                                    | See [auth](#auth).                                                                   |
| `plugins`   | `{}`                                    | `{ before: [], after: [] }`: plugins mounted before and after your routes, in order. |

### packages

`morgan`, `cors`, `helmet`, `rateLimit`, `compression`, `express` (`express.json` options) and `urlencoded`. Each one you set replaces its default whole, and the others keep theirs. `false` disables one.

| Package       | Default | Notes                                                                                                                                      |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `morgan`      | on      | Logs `:timestamp \| :method :path :status` to stdout, synchronously. `:path` has no query string; use `:url` in `format` for the full URL. |
| `cors`        | on      | `cors` options.                                                                                                                            |
| `helmet`      | on      | `helmet` options.                                                                                                                          |
| `rateLimit`   | off     | `{ capacity, refillPerSecond, message }`, defaults `100`, `1`, `nano.error.tooManyRequests`.                                               |
| `compression` | off     | `true` to turn it on when no proxy compresses.                                                                                             |

`rateLimit` limits every request per client IP, Better Auth's endpoints too. Each request spends a token of the client's bucket, which refills over time. Without a token it answers `429` with `message` and `Retry-After`. The addresses of an IPv6 `/56` are one client. Buckets live in the memory of each process.

### Client IP

By default the backend reads `X-Forwarded-For` only when the request comes from loopback or a private network (`127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), and takes the last address that is not one of them. Better Auth gets the same networks as `advanced.ipAddress.trustedProxies`.

| Case                         | Settings                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A public proxy (a CDN)       | Its addresses in `settings['trust proxy']` ([Express values](https://expressjs.com/en/guide/behind-proxies.html)) and in `advanced.ipAddress.trustedProxies`. |
| No proxy, or one not trusted | `settings: { 'trust proxy': false }` and `advanced.ipAddress.trustedProxies: []`.                                                                             |

## createRoute

Each `*.route.ts` under `routesDir` default-exports `createRoute`. **The file path is the URL**: `index.route.ts` → `/`, `api/users.route.ts` → `/api/users`.

```ts
export default createRoute({
  expression: '/:id',
  public: false,
  permissions: { note: ['read'] },
  callbacks: { onBefore: async (req, method, params) => ({}) },
  GET: async (req, params) => ({ result: { id: req.params.id } }),
  DELETE: { handler: remove, permissions: { note: ['delete'] } },
});
```

| Key                                     | Description                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `expression`                            | Appended to the path as is, in Express syntax: `/:id`, `{/:id}` for optional.                   |
| `public`                                | With Better Auth, answers without a session and checks no permissions.                          |
| `permissions`                           | Permissions of Better Auth's admin plugin the methods ask for. See [Permissions](#permissions). |
| `callbacks`                             | `onInit(params)` once when mounted; `onBefore(req, method, params)` before every request.       |
| `GET`, `POST`, `PUT`, `DELETE`, `QUERY` | A handler, or `{ handler, permissions }`.                                                       |

- Any other key, or an invalid value, stops the startup with the file and what is wrong.
- Only the default export is read: the file may export functions beside it, for its handlers and for code outside it, such as a job of the scheduler (`export async function sendMails(db) {…}`).
- An undeclared method answers `405`.
- What `onBefore` returns reaches the handler as `params.onBeforeResult` (`{}` without `onBefore`).

### Handler

`(req, params) => Promise<ApiResponse>`. `params` is read-only:

| Param            | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `options`        | The plugin's `options`.                                                             |
| `db`             | The Drizzle client of the app or the plugin; `undefined` without a database.        |
| `session`        | Better Auth's `{ user, session }`, also on a public route when the request has one. |
| `onBeforeResult` | What `onBefore` returned.                                                           |

### ApiResponse

```ts
type ApiResponse<T> = {
  status?: number; // HTTP status, 200 by default; not sent in the body
  success?: boolean; // set by the framework: status < 400
  result?: T;
  message?: string; // a key of the app's texts
  type?: 'success' | 'info' | 'warning' | 'error'; // how its message shows; without it, by success
};
```

A write returns the item as it is after it: `POST` the created item, `PUT` the updated item, `DELETE` the deleted item.

## Errors

The 404 and the error handler are mounted last. Anything a handler throws becomes an `ApiResponse`:

| Thrown                                                     | Answer                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `{ status: 409, message: 'notes.exists' }`                 | `409 { success: false, type: "error", message: "notes.exists" }`       |
| `'notes.nameRequired'`                                     | `400 { success: false, type: "error", message: "notes.nameRequired" }` |
| `{ status: 422, message: 'notes.check', type: 'warning' }` | `422 { success: false, type: "warning", … }`                           |
| `new Error('boom')`, a Postgres error                      | `500 nano.error.internal`, logged to stderr                            |
| a request to an unknown path                               | `404 nano.error.notFound`                                              |

The framework's message keys are `nano.error.*` (`notFound`, `internal`, `notAuthenticated`, `forbidden`, `tooManyRequests`) and `nano.auth.*`.

## database

Turns on Drizzle on `DATABASE_URL`. Install `drizzle-orm` and `pg`, and `drizzle-kit` for `push`.

```ts
createNanoApp({ database: { relations: defineRelations(schema), push: true } });
```

| Key         | Description                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `relations` | What `defineRelations` gives of your tables. A `pgSchema` they use is exported from the module too.                                          |
| `push`      | `true` applies the tables at startup with drizzle-kit's push, only to the schemas they use. A change that would lose data stops the startup. |
| `migrate`   | The folder `drizzle-kit generate` writes: its pending migrations run at startup, before `push`.                                              |
| any other   | Passed to Drizzle as its options.                                                                                                            |

- The startup fails without `DATABASE_URL`.
- A Postgres lock covers the migrations and the push of every database, across replicas.
- One pool serves the app, Better Auth and every plugin. It connects on its first query.
- Each `nano_*` Postgres schema is reserved for the plugin of its name (`nano_auth` for Better Auth): a table of yours in one fails the startup.

## auth

Better Auth's options, everything but `database`. Install `better-auth`, `kysely` and `pg`, and set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.

```ts
createNanoApp({ auth: { emailAndPassword: { enabled: true } } });
```

- It uses the pool of `DATABASE_URL`: the startup fails without it.
- Its tables live in the Postgres schema `nano_auth`. `auth.database` says how they are applied, `{ push: true }` by default: `push` adds what new options need and never drops; `migrate` is a folder of Drizzle migrations of them (`npx auth generate --adapter drizzle`, then `drizzle-kit generate`).
- Its endpoints are mounted at its `basePath` (`/auth` by default), before the plugins and your routes, and stay public.
- Its endpoints answer an `ApiResponse`: `{ success: true, result: <Better Auth's answer> }`, and a failure `{ success: false, type: 'error', message: 'nano.auth.<code>', code }` with its status. Redirects go as they are, and `api.getSession` keeps Better Auth's answer.
- With it on, every route of the app and of every plugin needs a session: `401 nano.error.notAuthenticated` without one.
- Extra user fields go in `user.additionalFields`.
- In production, Better Auth limits sign-in, sign-up and password reset per client IP.

### Permissions

A route asks for permissions of Better Auth's [admin plugin](https://www.better-auth.com/docs/plugins/admin). Add `admin({ ac, roles })` to `auth.plugins`. A user without them gets `403 nano.error.forbidden`.

- `permissions` of the route apply to every method that is a plain function. `{ handler, permissions }` replaces them for one method.
- Without any, a session is enough.
- A public route checks none. Without Better Auth nothing checks them.

## createPlugin

```ts
export default createPlugin((oOptions: MyOptions) => ({
  name: 'hello',
  basePath: '/hello',
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
  routes: { '/extra': createRoute({ GET: handler }) },
  database: { relations },
  options: { greeting: oOptions.greeting },
  callbacks: { onMount: async params => {} },
}));
```

| Key         | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `name`      | Its name. Its tables may live in the Postgres schema `nano_<name>`.         |
| `basePath`  | Its default base path. The app moves it with `plugin({ basePath })`.        |
| `routesDir` | A real directory of `*.route.ts` files, loaded with `jiti`.                 |
| `routes`    | Routes made in code, by path. A path in both takes the one in `routes`.     |
| `database`  | Its own `relations`, `push`, `migrate`. Without it, it gets the app's `db`. |
| `options`   | Reaches every callback and handler of its routes in `params.options`.       |
| `callbacks` | `onMount(params)`: once, after its database and before its endpoints.       |

The endpoints of one plugin have no guaranteed order: one route's `onInit` must not depend on another's.

### Mount order

```
base middlewares → Better Auth → before plugins → your routes → after plugins → 404 → error handler
```
