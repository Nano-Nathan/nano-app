# Conventions

nano-app prefers convention over configuration: a file in the right folder works without registering it. The convention is also what lets the framework check an app at startup, before the first request.

## Files that do something

| File                                   | Half     | What it becomes                                         |
| -------------------------------------- | -------- | ------------------------------------------------------- |
| `src/routes/**/*.route.ts`             | backend  | An endpoint. Its path is its URL                        |
| `src/plugins/<name>/routes/*.route.ts` | backend  | An endpoint of the plugin, under its `basePath`         |
| `src/stores/**/*.store.ts`             | frontend | A store, named after its path                           |
| `src/i18n/<locale>.i18n.ts`            | frontend | The texts of a locale                                   |
| `src/proxy.ts`                         | frontend | The proxy of Next, which sends `/api/*` to the backends |

## Paths are names

The path of a file is the name of what it makes:

- `src/routes/admin/users.route.ts` answers `/admin/users`, and `index.route.ts` answers `/`.
- `src/stores/admin/users.store.ts` is the store `admin_users`. If it is an api store, it is served on `/api/admin_users` and its backend URL is `API_ADMIN_USERS_URL`.

One name is used everywhere, so there is nothing to keep in step by hand.

## Fail fast

The backend loads every route file at startup and checks it. A file with an unknown key, an invalid value, a missing `DATABASE_URL` or a table in a reserved schema stops the startup with the file and the problem. An app that starts has a valid configuration: errors do not wait for the first request.

## Keys, not sentences

The backend never answers a sentence. `message: 'notes.created'` is a key of the app's texts, and `nano.*` keys are the framework's. The frontend turns a key into text in the user's locale. One backend serves every language, and an app changes any text of the framework by writing the same key.

## One way to do each thing

- Every answer is an `ApiResponse`.
- Every controller is a class that extends `Controller`, and every view comes from `createView`.
- Every plugin is a `createPlugin` factory, mounted `before` or `after` the app's routes.

A second way to do the same thing is not added: it is more to learn and more to maintain.
