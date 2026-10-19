# @nano-app/plugins

Official plugins for [`@nano-app/backend`](https://www.npmjs.com/package/@nano-app/backend). One import path per plugin: `@nano-app/plugins/<name>`. Nothing is mounted unless you list it.

```bash
npm install @nano-app/backend @nano-app/plugins
```

```ts
import { createNanoApp } from "@nano-app/backend";
import health from "@nano-app/plugins/health";

createNanoApp({ plugins: [health()] });
```

## Plugins

| Plugin | Import | Endpoints | Options |
|---|---|---|---|
| `health` | `import health from "@nano-app/plugins/health"` | `GET /health` → `{ status: "ok" }` | `basePath` (default `"/health"`) |

## Layout

```
plugins/
└── <name>/
    ├── index.ts        default-exports the createPlugin factory: the import path
    └── routes/         *.route.ts, mounted under the plugin's basePath
```

The plugin contract: [PLUGINS.md](https://github.com/Nano-Nathan/nano-app/blob/main/PLUGINS.md).
