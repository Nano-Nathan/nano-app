# 4. Sign in

In this step you protect the notes: the backend answers only with a session, and the frontend gets a login page and a navbar.

## Turn on Better Auth

Install Better Auth in the backend:

```bash
pnpm --filter backend add better-auth kysely
```

Add its settings to `.env`. The secret is any long random text:

```bash
BETTER_AUTH_SECRET=change-me-to-a-long-random-text
BETTER_AUTH_URL=http://localhost:3000
```

Add `auth` to `backend/src/app.ts`:

```ts
createNanoApp({
  database: { relations: defineRelations(schema), push: true },
  auth: { emailAndPassword: { enabled: true }, trustedOrigins: ['http://localhost:3001'] },
  plugins: { before: [health()], after: [crud({ models: ['note'] })] },
});
```

- `emailAndPassword` lets users sign up and sign in with an email and a password.
- `trustedOrigins` is the URL of the frontend: Better Auth checks it on every `POST`.

The backend restarts and creates the tables of Better Auth. Now every route needs a session:

```bash
curl http://localhost:3000/note
```

```json
{ "success": false, "type": "error", "message": "nano.error.notAuthenticated" }
```

`/health` still answers: the `health` plugin is public.

## Add the login page

Create `frontend/src/app/login/page.tsx`:

```tsx
import { createLoginPage } from '@nano-app/mantine/server';

export default createLoginPage({});
```

## Protect the page

Install the icons for the navbar:

```bash
pnpm --filter frontend add @tabler/icons-react
```

Move `frontend/src/app/page.tsx` to `frontend/src/app/(private)/page.tsx`, and wrap it with `createPage`:

```tsx
import { Container } from '@mantine/core';
import { createPage } from '@nano-app/frontend/server';
import Notes from '@/components/Notes';

export default createPage({ redirect: '/login' }, () => (
  <Container py="xl">
    <Notes />
  </Container>
));
```

Create `frontend/src/app/(private)/layout.tsx` with the shell:

```tsx
import { IconNotes } from '@tabler/icons-react';
import { createShell } from '@nano-app/mantine/server';

export default createShell({
  title: 'notes',
  links: [{ href: '/', label: 'nano.shell.home', icon: <IconNotes /> }],
});
```

The shell shows your links, then the user, the theme switch and the sign-out.

`(private)` is a route group of Next: it does not change the URL, and keeps `/login` out of the shell.

## Try it

Open `http://localhost:3001`. Without a session, it goes to `/login`. Click the link to sign up, and create an account. You land on the notes, inside the shell, with your user in the navbar.

Sign out from the navbar: you are back at `/login`.

## What you built

- A table with a full REST API from one line of `crud`.
- A page that reads, adds and validates notes without fetch code or hooks.
- Sign-up, sign-in, sessions and a protected backend from one option.

## Where to go next

- [Ask for permissions](/guides/permissions) so only some users can delete.
- [Validate crud bodies](/guides/validate-crud) so a body cannot write any column.
- [Add a language](/guides/texts-and-locales).
- [Deploy](/guides/deploy) with the Docker images of the app.
- [How the pieces fit](/concepts/architecture).
