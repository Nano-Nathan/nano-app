# Keep a proxy of your own

Next takes one `proxy.ts`. Use this when the app needs its own logic there (a redirect, a header) besides the proxy of nano-app.

Call nano-app's proxy for `/api`, and keep `/api` in the `matcher`:

```ts
// src/proxy.ts
import { NextResponse } from 'next/server';
import { proxy as nanoProxy } from '@nano-app/frontend/proxy';
import type { NextRequest } from 'next/server';

export function proxy(oReq: NextRequest) {
  if (!oReq.nextUrl.pathname.startsWith('/dashboard/')) return nanoProxy(oReq);

  // Your own logic
  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*', '/dashboard/:path*'] };
```

- Write `config` in your own `proxy.ts`: Next ignores a re-exported `matcher`.
- Without a `matcher` the proxy still works, but runs on every request (pages, static files).
