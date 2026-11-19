# 2. Store notes

In this step you add a `note` table and a REST API for it.

## Add the database

Install Drizzle and the PostgreSQL driver in the backend:

```bash
pnpm --filter backend add drizzle-orm pg drizzle-kit
```

Add the URL of your database to `.env`:

```bash
DATABASE_URL=postgres://postgres:notes@localhost:5432/postgres
```

Create `backend/src/db/schema.ts` with the table:

```ts
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const note = pgTable('note', {
  id: serial().primaryKey(),
  title: text().notNull(),
});
```

## Publish the table

Replace `backend/src/app.ts`:

```ts
import { defineRelations } from 'drizzle-orm';
import { createNanoApp } from '@nano-app/backend';
import crud from '@nano-app/plugins/crud';
import health from '@nano-app/plugins/health';
import * as schema from './db/schema.ts';

createNanoApp({
  database: { relations: defineRelations(schema), push: true },
  plugins: { before: [health()], after: [crud({ models: { note: schema.note } })] },
});
```

- `database` turns on the database. `push: true` creates the `note` table when the backend starts.
- `crud` is the official plugin that gives a REST API for each table in `models`.

Save the file. The backend restarts, creates the table and logs the paths it mounted.

## Try it

Create a note:

```bash
curl -X POST http://localhost:3000/note -H 'Content-Type: application/json' -d '{"title":"First note"}'
```

```json
{ "success": true, "result": { "id": 1, "title": "First note" } }
```

List the notes:

```bash
curl http://localhost:3000/note
```

```json
{ "success": true, "result": [{ "id": 1, "title": "First note" }] }
```

You did not write a route: `crud` answers `GET`, `QUERY`, `POST`, `PUT` and `DELETE` on `/note`.

**Next:** [Show and add notes](./show-notes)
