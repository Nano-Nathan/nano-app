# @nano-app/mantine

[![mantine](https://img.shields.io/npm/v/@nano-app/mantine?label=mantine)](https://www.npmjs.com/package/@nano-app/mantine)

[Mantine](https://mantine.dev) for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend): the root layout, the views of [`@nano-app/controllers`](https://www.npmjs.com/package/@nano-app/controllers), a shell for signed-in pages, and ready login and 404 pages.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/controllers @mantine/core @mantine/dates @mantine/hooks @mantine/notifications @mantine/nprogress dayjs
```

```tsx
// src/app/layout.tsx
import { createLayout } from '@nano-app/mantine/server';

export default createLayout({ lang: 'en' });
```

```tsx
// src/app/login/page.tsx
import { createLoginPage } from '@nano-app/mantine/server';

export default createLoginPage({});
```

**Documentation:** [reference](https://nano-app-docs.pages.dev/reference/mantine), and the [tutorial](https://nano-app-docs.pages.dev/tutorial/) to start.
