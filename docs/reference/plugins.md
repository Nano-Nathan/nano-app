# @nano-app/plugins

The official plugins of the backend. One import path per plugin, and nothing is mounted unless the app lists it.

```bash
pnpm add @nano-app/backend @nano-app/plugins
```

Every plugin takes `basePath` besides its own options.

## health

```ts
import health from '@nano-app/plugins/health';

createNanoApp({ plugins: { before: [health()] } });
```

| Endpoint      | Answer                                        |
| ------------- | --------------------------------------------- |
| `GET /health` | `{ success: true, result: { status: "ok" } }` |

Public: it answers without a session. `basePath` defaults to `/health`.

## crud

```ts
import crud from '@nano-app/plugins/crud';

createNanoApp({ plugins: { after: [crud({ models: { note: schema.note } })] } });
```

### Options

| Option        | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| `models`      | The published tables, keyed by their name in the app's relations: `{ note, comment }`. |
| `validations` | zod schemas of the bodies, per model and action. See [validations](#validations).      |
| `basePath`    | None by default: `/<model>`. `'/api'` gives `/api/<model>`.                            |

### Endpoints

| Request                 | Answer                                                 | Permission |
| ----------------------- | ------------------------------------------------------ | ---------- |
| `GET /<model>`          | The list in `result`                                   | `read`     |
| `GET /<model>/<id>`     | One record                                             | `read`     |
| `QUERY /<model>{/<id>}` | The list or one record, with `QueryParams` as the body | `read`     |
| `POST /<model>`         | The created record                                     | `create`   |
| `PUT /<model>/<id>`     | The updated record                                     | `update`   |
| `DELETE /<model>/<id>`  | The deleted record                                     | `delete`   |

- `QueryParams` is Drizzle's relational query: `where`, `columns`, `orderBy`, `limit`, `offset`, `with`. Without `limit`, `100`.
- Postgres casts `<id>` to the type of the `id` column.
- A model not in `models` answers `404`.
- Permissions are asked only with Better Auth on, and only on the table of the URL. `403` without them.
- A Postgres error of a write (a duplicate, a missing reference) answers `500`.
- Mounted `before`, it takes its URLs from your routes. Mounted `after`, a route of yours on one of its URLs takes every method of it.

### validations

Per model, a zod schema per action:

| Action   | Checks                                  |
| -------- | --------------------------------------- |
| `read`   | The body of `QUERY`, and `{}` for `GET` |
| `create` | The body of `POST`                      |
| `update` | The body of `PUT`                       |

A body that breaks its validation answers `400` with the field and zod's message. One that passes goes on as zod gives it: keys it does not name are dropped and defaults are set. Without a validation, the body goes to Drizzle as it came.

### Related tables

A query runs on the app's client: `with` and `where` reach the tables Drizzle's relations give, also those not in `models`. The `read` validation decides what a query may load. Better Auth's tables live in `nano_auth`, outside the app's relations: `crud` does not reach them.

## Layout of a plugin

```
plugins/<name>/
├── index.ts        default-exports the plugin factory: the import path
├── schema.ts       its tables, in the Postgres schema nano_<name>
└── routes/         *.route.ts, under the plugin's basePath
```

New official plugins are added only when a maintainer asks for them in an issue. Publish yours as a separate package: see [Write a plugin](/guides/write-a-plugin).
