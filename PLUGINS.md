# Plugins

`@nano-app/backend` ships the plugin contract and no official plugin. A plugin is a `createPlugin` factory: options in, `PluginConfig` out. The app mounts only the plugins you list.

## A plugin in your app

```
src/
├── app.ts
└── plugins/
    └── hello/
        ├── index.ts
        └── routes/
            └── index.route.ts      →  /hello
```

```ts
// src/plugins/hello/index.ts
import { createPlugin } from "@nano-app/backend";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default createPlugin((options?: { basePath?: string }) => ({
  name: "hello",
  basePath: options?.basePath ?? "/hello",
  stage: "before",
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), "routes"),
}));
```

```ts
// src/plugins/hello/routes/index.route.ts
import { createRoute } from "@nano-app/backend";

export default createRoute({
  GET: async () => ({ success: true, result: { ok: true } }),
});
```

```ts
// src/app.ts
import { createNanoApp } from "@nano-app/backend";
import hello from "./plugins/hello";

createNanoApp({ plugins: [hello()] });
```

`stage` is `"before"` (default) or `"after"` the app's own routes. Mount order: base middlewares, `before` plugins, your routes, `after` plugins, 404, error handler.

`routesDir` must be a real directory of `*.route.ts` files when you run the app from source (`tsx`). `jiti` loads them. There is no compile step for your routes.

## A plugin other people can install

Publish a separate package. Do not add it to this repository unless a maintainer has agreed to own it.

```json
{
  "name": "@you/nano-app-plugin-hello",
  "type": "module",
  "peerDependencies": {
    "@nano-app/backend": "^0.7.0"
  },
  "license": "MIT"
}
```

Export the `createPlugin` factory as the package entry. The consumer installs both packages and passes the factory to `plugins`.

Use MIT or Apache-2.0 if you want the plugin listed from this repo later. Open an issue with the package name and a short description. A maintainer adds the link. The plugin stays in your repository.

## Database

Optional. Set `database: { enabled: true, schemaPath }` on the plugin config. The schema must be PostgreSQL. Schemas starting with `nano_` are reserved for plugins that ship with the framework.

`npx nano-app generate` and `npx nano-app push` read `plugins/<name>/schema.prisma` from the installed `@nano-app/backend` package. That path is for a plugin that lives inside this package. A plugin in your app, or in another npm package, points `schemaPath` at its own file and generates the client with Prisma (or with `nano-app generate app --schema <path>` for the app schema).

The handler receives that client as the second argument. Annotate it with your generated `PrismaClient`.

## What belongs in this repository

Pull requests to `backend/` and `core/` are welcome. A pull request that adds `backend/plugins/<name>` is not, until the maintainers ask for that plugin. Official plugins, when they exist, will be versioned with the backend and exported on purpose. This release has no `./plugins` export.
