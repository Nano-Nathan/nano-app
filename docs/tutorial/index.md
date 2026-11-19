# Tutorial: a notes app

In this tutorial you build a small notes app with nano-app: a backend with a database, a page that lists and adds notes, and a sign-in that protects them. Each step ends with something you can see working.

## What you build

- A `note` table in PostgreSQL, with a full REST API and no route code.
- A page with a form to add a note and a list of the notes.
- A login page, a navbar for signed-in users, and a backend that answers only with a session.

## What you need

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer.
- pnpm.
- A PostgreSQL database and its connection URL. A free [Neon](https://neon.tech) project works, or a local one:

```bash
docker run -d --name notes-db -e POSTGRES_PASSWORD=notes -p 5432:5432 postgres
# DATABASE_URL=postgres://postgres:notes@localhost:5432/postgres
```

## Steps

1. [Create the app](./create-the-app)
2. [Store notes](./store-notes)
3. [Show and add notes](./show-notes)
4. [Sign in](./sign-in)

It takes about 30 minutes.
