# @nano-app/plugins

[![plugins](https://img.shields.io/npm/v/@nano-app/plugins?label=plugins)](https://www.npmjs.com/package/@nano-app/plugins)

Official plugins for [`@nano-app/backend`](https://www.npmjs.com/package/@nano-app/backend). One import path per plugin: `@nano-app/plugins/<name>`. Nothing is mounted unless you list it.

```bash
pnpm add @nano-app/backend @nano-app/plugins
```

```ts
import { createNanoApp } from '@nano-app/backend';
import health from '@nano-app/plugins/health';

createNanoApp({ plugins: [health()] });
```

## Plugins

| Plugin | Import | Endpoints | Options |
|---|---|---|---|
| `health` | `import health from '@nano-app/plugins/health'` | `GET /health` → `{ status: "ok" }` | `basePath` (default `"/health"`) |

## Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the plugin factory: the import path
    ├── schema.prisma   its tables, when it has any
    ├── migrations/     their migrations, applied at startup
    └── routes/         *.route.ts, mounted under the plugin's basePath
```

The plugin contract: [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).
