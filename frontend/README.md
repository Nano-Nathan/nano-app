# @nano-app/frontend

[![frontend](https://img.shields.io/npm/v/@nano-app/frontend?label=frontend)](https://www.npmjs.com/package/@nano-app/frontend)

Frontend of [nano-app](https://github.com/Nano-Nathan/nano-app) for Next.js apps: UI state in stores, controllers whose methods the views use, and a proxy that sends `/api/*` to the backend.

```bash
pnpm add @nano-app/frontend
```

```ts
// next.config.ts
import { withNanoApp } from '@nano-app/frontend/next';

export default withNanoApp({});
```

```tsx
// src/components/Counter.tsx
'use client';

import { Controller, createView } from '@nano-app/frontend';

class CounterController extends Controller {
  increment(): void {
    this.stores.app.set('/iCount', (this.stores.app.get('/iCount') ?? 0) + 1);
  }
}

export default createView(CounterController, counter => (
  <button onClick={counter.increment}>{counter.stores.app.get('/iCount') ?? 0}</button>
));
```

Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. Next.js 16.3 and React 19 or newer, as peer dependencies.

**Documentation:** [reference](https://nano-app-docs.pages.dev/reference/frontend), and the [tutorial](https://nano-app-docs.pages.dev/tutorial/) to start.

## Test app

`tests/app` is a Next app that uses the package from the workspace:

```bash
pnpm --filter @nano-app/frontend build
pnpm --filter nano-frontend-test-app build
API_BACKEND_URL=http://localhost:3000 pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```

Point it at any backend that answers `GET`, `QUERY` (`offset`, `limit`, `orderBy`), `POST`, `PUT` and `DELETE` on `/users` with an `ApiResponse`. `/private` is a page with a session: the backend has Better Auth with `emailAndPassword`, and `http://localhost:3100` in its `trustedOrigins`.
