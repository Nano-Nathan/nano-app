# @nano-app/backend

[![backend](https://img.shields.io/npm/v/@nano-app/backend?label=backend)](https://www.npmjs.com/package/@nano-app/backend)

Express 5 server with **file-convention routes** and **plugins**: it mounts the base middlewares, discovers your routes, formats every error as JSON, and turns on PostgreSQL (Drizzle) and Better Auth when you ask.

```bash
pnpm add @nano-app/backend
```

```ts
// src/app.ts
import { createNanoApp } from '@nano-app/backend';

createNanoApp({ port: 3000 });
```

```ts
// src/routes/health.route.ts  →  GET /health
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async () => ({ result: { status: 'ok' } }),
});
```

Node.js 22.23.4, 24.22.1 or 26.12.1 and newer, or Bun 1.4.4 and newer. ESM only.

**Documentation:** [reference](https://nano-app-docs.pages.dev/reference/backend), and the [tutorial](https://nano-app-docs.pages.dev/tutorial/) to start.

## Development

```bash
pnpm build     # tsdown → build/ (ESM + .d.ts)
pnpm dev       # tsdown --watch
pnpm test      # node:test against the real server (tsx --test)
DATABASE_URL=postgres://… pnpm test   # also runs the PostgreSQL suite
```

## License

MIT — Cristian Serrano.
