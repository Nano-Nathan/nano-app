# @nano-app/frontend

Frontend of [nano-app](https://github.com/Nano-Nathan/nano-app) for Next.js apps. Work in progress: for now it only gives `NanoAppProvider`, the root of the app's React tree.

## Quick start

```bash
pnpm add @nano-app/frontend
```

```tsx
// app/layout.tsx
import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <NanoAppProvider>{children}</NanoAppProvider>
      </body>
    </html>
  );
}
```

## Stores

Each `src/**/*.store.ts` file is a store, named after its file (`src/stores/app.store.ts` → `app`). Turbopack finds them at build time; an invalid file is skipped with a warning. An empty `app` store always exists.

```ts
// src/stores/app.store.ts
import type { StoreFile } from '@nano-app/frontend';

export default { type: 'app', data: { counter: 0 } } satisfies StoreFile;
```

```tsx
'use client';
import { useStore } from '@nano-app/frontend';

export default function Counter() {
  const oApp = useStore('app');
  const iCounter = oApp.get<number>('/counter');
  return <button onClick={() => oApp.set('/counter', iCounter + 1)}>{iCounter}</button>;
}
```

- `get(path)` reads a value by path (`/drawer/isOpen`); the component re-renders when it changes.
- `set(path, value)` writes it, creating the levels that are missing.
- Each `<NanoAppProvider>` tree has its own state: on the server, one per request.

## Test app

`tests/app` is a Next app that uses the package from the workspace:

```bash
pnpm --filter @nano-app/frontend build
pnpm --filter nano-frontend-test-app build
pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```
