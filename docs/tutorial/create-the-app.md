# 1. Create the app

Create the app and run it:

```bash
pnpm create @nano-app notes
cd notes
pnpm install
cp .env.example .env
pnpm dev
```

`pnpm dev` starts both halves of the app. Open them:

- `http://localhost:3001` shows a page that says **Hello World**. This is the frontend.
- `http://localhost:3000/health` answers `{"success":true,"result":{"status":"ok"}}`. This is the backend.

## What you have

```
notes/
├── .env                      API_API_URL=http://localhost:3000
├── backend/
│   └── src/app.ts
└── frontend/
    └── src/
        ├── app/layout.tsx
        ├── app/page.tsx
        └── proxy.ts
```

Open `backend/src/app.ts`:

```ts
import { createNanoApp } from '@nano-app/backend';
import health from '@nano-app/plugins/health';

// The app on :3000, with GET /health for the probes
createNanoApp({ plugins: { before: [health()] } });
```

`createNanoApp` starts the server. `health` is a plugin: a group of ready routes. It gives `GET /health`.

Notice `frontend/src/proxy.ts`. It sends every request to `/api/api/...` on the frontend to the backend at `API_API_URL`. The browser never calls the backend directly.

Leave `pnpm dev` running. It reloads both halves when you save a file.

**Next:** [Store notes](./store-notes)
