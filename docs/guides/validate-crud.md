# Validate crud bodies

By default `crud` checks the body of `POST` and `PUT` against the columns of the table, with `createInsertSchema` and `createUpdateSchema` of `drizzle-orm/zod`: a `POST` can still write any column, `id` included. A `QUERY` goes to Drizzle as it came, with any `limit` and any `with`. Use this guide to give a model rules of its own.

## Set the rules of a model

A validation of an action replaces the default one. Build it from the table:

```bash
pnpm --filter backend add zod
```

```ts
import { createInsertSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import * as schema from './db/schema.ts';

crud({
  models: ['note'],
  validations: {
    note: {
      create: createInsertSchema(schema.note).omit({ id: true }),
      update: createUpdateSchema(schema.note).omit({ id: true }),
      read: z.looseObject({ limit: z.number().max(50).default(20) }),
    },
  },
});
```

- `create` checks the body of `POST`, `update` the body of `PUT`, `read` the body of `QUERY` (and `{}` for `GET`). Without `create` or `update`, the table's schema checks them.
- A body that fails answers `400` with the field and zod's message.
- A body that passes goes on as zod returns it: keys the schema does not name are dropped, and defaults are set.

## Keep a query in its table

A `QUERY` can load related tables with `with`. To forbid it, make `read` strict without `with`:

```ts
read: z.strictObject({
  where: z.unknown().optional(),
  orderBy: z.unknown().optional(),
  limit: z.number().max(50).default(20),
  offset: z.number().optional(),
}),
```

**Reference:** [crud](/reference/plugins#crud).
