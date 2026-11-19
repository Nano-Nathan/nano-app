# Ask for permissions

Use this when some users may do things that others may not: only admins delete, only editors write.

You need [Better Auth turned on](/reference/backend#auth).

## Define the roles

Add Better Auth's [admin plugin](https://www.better-auth.com/docs/plugins/admin) with your statements and roles:

```ts
// src/auth/roles.ts
import { createAccessControl } from 'better-auth/plugins/access';

export const ac = createAccessControl({ note: ['read', 'create', 'update', 'delete'] });

export const roles = {
  user: ac.newRole({ note: ['read', 'create'] }),
  admin: ac.newRole({ note: ['read', 'create', 'update', 'delete'] }),
};
```

```ts
// src/app.ts
import { admin } from 'better-auth/plugins';
import { ac, roles } from './auth/roles.ts';

createNanoApp({
  auth: { emailAndPassword: { enabled: true }, plugins: [admin({ ac, roles })] },
});
```

## Ask for them in a route

```ts
export default createRoute({
  permissions: { note: ['read'] },
  GET: async (_req, { db }) => ({ result: await db.query.note.findMany() }),
  DELETE: { handler: remove, permissions: { note: ['delete'] } },
});
```

- `permissions` of the route apply to every method that is a plain function.
- A method written as `{ handler, permissions }` asks for its own instead.
- A user without them gets `403 nano.error.forbidden`.

## With crud

`crud` asks for them by itself: `read` for `GET` and `QUERY`, `create` for `POST`, `update` for `PUT` and `delete` for `DELETE`, on the table of the URL. The roles above are enough.

## Keep in mind

- A `public` route checks no permissions.
- Without Better Auth nothing checks them: the route answers anyway.
