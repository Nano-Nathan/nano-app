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

createNanoApp({ plugins: { after: [crud({ models: ['note'] })] } });
```

### Options

| Option        | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `models`      | The published tables, by their name in the app's relations: `['note', 'comment']`. |
| `validations` | zod schemas of the bodies, per model and action. See [validations](#validations).  |
| `basePath`    | None by default: `/<model>`. `'/api'` gives `/api/<model>`.                        |

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
- A model not in `models` answers `404`. One in `models` but not in the app's relations stops the startup.
- Permissions are asked only with Better Auth on, and only on the table of the URL. `403` without them.
- A Postgres error of a write (a duplicate, a missing reference) answers `500`.
- Mounted `before`, it takes its URLs from your routes. Mounted `after`, a route of yours on one of its URLs takes every method of it.

### validations

Per model, a zod schema per action:

| Action   | Checks                                                                      |
| -------- | --------------------------------------------------------------------------- |
| `read`   | The body of `QUERY`, and `{}` for `GET`                                     |
| `create` | The body of `POST`; by default, Drizzle's `createInsertSchema` of the table |
| `update` | The body of `PUT`; by default, Drizzle's `createUpdateSchema` of the table  |

A body that breaks its validation answers `400` with the field and zod's message. One that passes goes on as zod gives it: keys it does not name are dropped and defaults are set. A `QUERY` without a `read` validation goes to Drizzle as it came.

### Related tables

A query runs on the app's client: `with` and `where` reach the tables Drizzle's relations give, also those not in `models`. The `read` validation decides what a query may load. Better Auth's tables live in `nano_auth`, outside the app's relations: `crud` does not reach them.

## scheduler

Runs functions on a cron. It has no endpoints.

```ts
import scheduler from '@nano-app/plugins/scheduler';

createNanoApp({
  plugins: {
    before: [
      scheduler({
        timezone: 'America/Argentina/Mendoza',
        jobs: [
          { name: 'debt-mails', cron: '0 12 25,1,10 * *', run: async ({ db }) => sendMails(db) },
        ],
      }),
    ],
  },
});
```

| Option     | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `jobs`     | `{ name, cron, run }`: `run` gets the params of a route callback, `db` too. |
| `timezone` | An IANA name for every cron. Without it, the process's.                     |

- Each job runs on its `cron` once the app starts. A sixth field in front of the cron is the seconds (`30 0 12 * * *`).
- Each run logs its start and its end with the name of its job. A run that throws is logged, and the next ones and the other jobs go on. A run still going when its next one comes skips that one, with a warning.
- The name of a job is unique in the app: two jobs of the same name stop the startup.
- The jobs run in the process, with no database: a run is lost while the process is down, and two replicas of the app run each job twice. Run one replica, or the scheduler in a process of its own.

## Layout of a plugin

```
plugins/<name>/
├── index.ts        default-exports the plugin factory: the import path
├── schema.ts       its tables, in the Postgres schema nano_<name>
└── routes/         *.route.ts, under the plugin's basePath
```

New official plugins are added only when a maintainer asks for them in an issue. Publish yours as a separate package: see [Write a plugin](/guides/write-a-plugin).
