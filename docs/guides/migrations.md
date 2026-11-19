# Apply schema changes

nano-app changes your tables only when you ask. Pick one way per app.

## push: for development

```ts
createNanoApp({ database: { relations: defineRelations(schema), push: true } });
```

At startup, drizzle-kit's push makes the database match your tables. A change that would lose data (a dropped column) stops the startup instead of running. Good for development and small apps.

## migrate: for production

Generate the migrations with drizzle-kit and commit them:

```bash
pnpm --filter backend exec drizzle-kit generate --dialect postgresql --schema src/db/schema.ts --out drizzle
```

```ts
createNanoApp({ database: { relations: defineRelations(schema), migrate: 'drizzle' } });
```

At startup, the pending migrations of the folder run. Every change is a file you reviewed.

## Neither

Without `push` or `migrate`, applying the schema is up to you (`drizzle-kit push`, or your pipeline).

## Keep in mind

- With both, the migrations run first, then the push.
- One startup at a time changes the database: a Postgres lock covers it across replicas.
- Better Auth applies its own tables in `nano_auth`, by itself.
- Each `nano_*` Postgres schema belongs to a plugin: a table of yours in one fails the startup.
