# Backend lifecycle

What `createNanoApp` does from the start of the process to the first request.

## Startup

1. **Configuration.** Every option is checked. An invalid one stops the process.
2. **Database.** With `database`, `auth` or a plugin with a database, nano-app opens one pool on `DATABASE_URL` and creates the Drizzle clients. It connects on its first query.
3. **Schema.** `migrate` and `push` run, the app's and each plugin's, under a Postgres lock: with several replicas, one changes the database at a time. Better Auth applies its tables in `nano_auth`.
4. **Routes.** Every `*.route.ts` of the app and of each plugin is loaded and checked. A plugin's `onMount` runs before its endpoints, and each route's `onInit` when it is mounted.
5. **Listen.** The server listens on `port` and logs every mounted path.

## Mount order

Everything is mounted on one Express application, in this order:

```
base middlewares → Better Auth → before plugins → your routes → after plugins → 404 → error handler
```

- A `before` plugin takes its paths ahead of your routes. An `after` plugin only gets the paths your routes leave.
- Better Auth's endpoints are mounted ahead of the plugins and your routes, and stay public.
- The 404 and the error handler are last: every error leaves as an `ApiResponse`.

## A request

1. The base middlewares run: logs, CORS, security headers, rate limit, body parsing.
2. With Better Auth on, the route checks the session (`401` without one) and its permissions (`403` without them), unless it is `public`.
3. The route's `onBefore` runs. What it returns reaches the handler as `params.onBeforeResult`.
4. The handler returns an `ApiResponse`, or throws.
5. The framework sends the `ApiResponse` with its `status`, or turns what was thrown into one.

## What is loaded

Drizzle, `pg` and Better Auth are loaded only when the app turns them on. An app without a database loads no database code.
