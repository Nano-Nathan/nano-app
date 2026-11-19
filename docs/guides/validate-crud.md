# Validate crud bodies

By default `crud` sends each body to Drizzle as it came: a `POST` can write any column, and a `QUERY` can ask for any `limit`. Use this guide to decide what a body may bring.

## Build the schemas from the table

`drizzle-orm/zod` builds zod schemas from a table:

```bash
pnpm --filter backend add zod
```

```ts
import { createInsertSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import * as schema from './db/schema.ts';

crud({
  models: { note: schema.note },
  validations: {
    note: {
      create: createInsertSchema(schema.note).omit({ id: true }),
      update: createUpdateSchema(schema.note).omit({ id: true }),
      read: z.looseObject({ limit: z.number().max(50).default(20) }),
    },
  },
});
```

- `create` checks the body of `POST`, `update` the body of `PUT`, `read` the body of `QUERY` (and `{}` for `GET`).
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
