# Write a plugin

A plugin groups routes under a base path, with its own options. Use one to reuse endpoints across apps, or to keep a feature apart in one app.

## In your app

```
src/plugins/hello/
├── index.ts
└── routes/
    └── index.route.ts      →  /hello
```

```ts
// src/plugins/hello/index.ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlugin } from '@nano-app/backend';

export default createPlugin((oOptions: { greeting?: string }) => ({
  name: 'hello',
  basePath: '/hello',
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
  options: { greeting: oOptions.greeting ?? 'Hello' },
}));
```

```ts
// src/plugins/hello/routes/index.route.ts
import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async (_req, { options }) => ({ result: { text: options.greeting } }),
});
```

```ts
// src/app.ts
import hello from './plugins/hello/index.ts';

createNanoApp({ plugins: { before: [hello({ greeting: 'Hi' })] } });
```

- What the plugin returns in `options` reaches every handler in `params.options`.
- The app moves it: `hello({ basePath: '/hi' })`.
- `before` mounts it ahead of your routes, `after` behind them.

## Routes in code

When the routes depend on the options, make them in `routes`, by path:

```ts
routes: Object.fromEntries(
  oOptions.models.map(sModel => [`/${sModel}`, createRoute({ GET: list })]),
),
```

## Setup once

`callbacks.onMount(params)` runs once, after the plugin's database and before its endpoints: open a client, start a job.

## With its own tables

Pass `database: { relations }` in the config, and keep its tables in the Postgres schema `nano_<name>`, reserved for it. `push: true` or `migrate` apply them at startup.

## Publish it

Publish it as a separate package that peers on the backend:

```json
{
  "name": "@you/nano-app-plugin-hello",
  "type": "module",
  "peerDependencies": { "@nano-app/backend": ">=0.11.0" },
  "license": "MIT"
}
```

Export the `createPlugin` factory as the entry. To have it listed in the nano-app repository, open an issue with its name and a short description.

**Reference:** [createPlugin](/reference/backend#createplugin).
