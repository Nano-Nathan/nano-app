# @nano-app/plugins

[![plugins](https://img.shields.io/npm/v/@nano-app/plugins?label=plugins)](https://www.npmjs.com/package/@nano-app/plugins)

Official plugins for [`@nano-app/backend`](https://www.npmjs.com/package/@nano-app/backend): `health`, `crud` and `scheduler`. One import path per plugin, and nothing is mounted unless you list it.

```bash
pnpm add @nano-app/backend @nano-app/plugins
```

```ts
import { createNanoApp } from '@nano-app/backend';
import crud from '@nano-app/plugins/crud';
import health from '@nano-app/plugins/health';

createNanoApp({ plugins: { before: [health()], after: [crud({ models: ['note'] })] } });
```

A plugin of your own is a `createPlugin` factory: see [Write a plugin](https://nano-app-docs.pages.dev/guides/write-a-plugin). A pull request that adds `plugins/<name>` is welcome only when a maintainer asked for that plugin in an issue.

**Documentation:** [reference](https://nano-app-docs.pages.dev/reference/plugins), and the [tutorial](https://nano-app-docs.pages.dev/tutorial/) to start.
