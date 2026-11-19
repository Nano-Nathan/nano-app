# Architecture

A nano-app app has two halves in one pnpm workspace: a backend that serves JSON, and a Next.js frontend that renders the pages and talks to the backend for the browser.

## The packages

| Package                 | Half     | What it gives                                                 |
| ----------------------- | -------- | ------------------------------------------------------------- |
| `@nano-app/backend`     | backend  | The Express 5 server, file routes, PostgreSQL and Better Auth |
| `@nano-app/plugins`     | backend  | Official plugins: `health`, `crud` and `scheduler`            |
| `@nano-app/frontend`    | frontend | Stores, controllers, views and the proxy to the backend       |
| `@nano-app/controllers` | frontend | Ready controllers: auth, forms, lists, navigation, messages   |
| `@nano-app/mantine`     | frontend | The root layout, the views of the controllers and ready pages |
| `@nano-app/create`      | —        | `pnpm create @nano-app`: a new app with both halves           |

Each package has its own version. The frontend packages only need the backend through HTTP: they work with any backend that answers an `ApiResponse`.

## A request

```
browser ──▶ Next server ──▶ proxy (/api/<store>/...) ──▶ backend ──▶ your route or a plugin
   ▲                                                                       │
   └──────────── ApiResponse kept in the store, the view renders ◀─────────┘
```

1. A controller calls a method of an api store: `this.stores.api.GET('/note')`.
2. The browser asks the Next server for `/api/api/note`. It never calls the backend itself.
3. The proxy of `@nano-app/frontend` rewrites the request to `API_API_URL/note`, with its method, headers, cookies and body.
4. The backend runs its middlewares, checks the session, and calls the handler of `/note`.
5. The handler returns an `ApiResponse`. The backend sends it as JSON, with its status.
6. The store keeps the answer at its path, and every view that read that path renders again.

The backend URL is read on the Next server at runtime and never reaches the browser.

## The contract between the halves

Every answer of the backend is an `ApiResponse`:

```ts
{ success: boolean, result?: T, message?: string, type?: 'success' | 'info' | 'warning' | 'error' }
```

- `result` is the data. A write answers the item as it is after it.
- `message` is a key of the app's texts, never a sentence. The frontend shows it in the user's locale.
- `success` follows the HTTP status: `status < 400`.

This contract is what lets the frontend show every message as a toast, count requests in progress, and keep reads, without code of the app.

## Who decides what

nano-app gives the place to set a rule; the app sets it. What a body may bring, how many records a list answers, who may sign up and which role can delete are the app's decisions. The framework does the work behind one small layer: `createRoute`, `createPlugin`, one config object, one controller to extend.
