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

## Test app

`tests/app` is a Next app that uses the package from the workspace:

```bash
pnpm --filter @nano-app/frontend build
pnpm --filter nano-frontend-test-app build
pnpm --filter nano-frontend-test-app start   # http://localhost:3100
```
