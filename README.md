# nano-app

[![backend](https://img.shields.io/npm/v/@nano-app/backend?label=backend)](https://www.npmjs.com/package/@nano-app/backend)
[![plugins](https://img.shields.io/npm/v/@nano-app/plugins?label=plugins)](https://www.npmjs.com/package/@nano-app/plugins)
[![frontend](https://img.shields.io/npm/v/@nano-app/frontend?label=frontend)](https://www.npmjs.com/package/@nano-app/frontend)
[![controllers](https://img.shields.io/npm/v/@nano-app/controllers?label=controllers)](https://www.npmjs.com/package/@nano-app/controllers)
[![mantine](https://img.shields.io/npm/v/@nano-app/mantine?label=mantine)](https://www.npmjs.com/package/@nano-app/mantine)
[![create](https://img.shields.io/npm/v/@nano-app/create?label=create)](https://www.npmjs.com/package/@nano-app/create)
[![license](https://img.shields.io/npm/l/@nano-app/backend)](https://github.com/Nano-Nathan/nano-app/blob/main/LICENSE)

Full-stack apps from files in the right folders. In the backend you write `*.route.ts` files: `@nano-app/backend` discovers them, mounts an Express 5 server, and turns every `ApiResponse` into HTTP. In a Next.js frontend you write `*.store.ts` files and controllers: `@nano-app/frontend` keeps the UI state in stores and talks to the backend through its proxy.

**Documentation: [nano-app-docs.pages.dev](https://nano-app-docs.pages.dev)** — [tutorial](https://nano-app-docs.pages.dev/tutorial/), [guides](https://nano-app-docs.pages.dev/guides/permissions), [reference](https://nano-app-docs.pages.dev/reference/backend) and [concepts](https://nano-app-docs.pages.dev/concepts/architecture).

While the version is `0.x`, the public API can change.

## Start

```bash
pnpm create @nano-app my-app
cd my-app
pnpm install
cp .env.example .env
pnpm dev
```

Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.

## Packages

| Package                 | Directory      | Role                                                                     | Reference                                                            |
| ----------------------- | -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `@nano-app/backend`     | `backend/`     | Express server, file routes, optional PostgreSQL and Better Auth         | [backend](https://nano-app-docs.pages.dev/reference/backend)         |
| `@nano-app/plugins`     | `plugins/`     | Official backend plugins: `health` and `crud`                            | [plugins](https://nano-app-docs.pages.dev/reference/plugins)         |
| `@nano-app/frontend`    | `frontend/`    | Next.js stores, controllers and the proxy to the backend                 | [frontend](https://nano-app-docs.pages.dev/reference/frontend)       |
| `@nano-app/controllers` | `controllers/` | Official frontend controllers                                            | [controllers](https://nano-app-docs.pages.dev/reference/controllers) |
| `@nano-app/mantine`     | `mantine/`     | Mantine for the frontend: layout, views of the controllers, ready pages  | [mantine](https://nano-app-docs.pages.dev/reference/mantine)         |
| `@nano-app/create`      | `create/`      | A new app from `template/`: `pnpm create @nano-app my-app`               | [create](https://nano-app-docs.pages.dev/reference/create)           |
| `@nano-app/core`        | `core/`        | Private: convention loader, types and constants, inlined into the builds | —                                                                    |

Each published package has its own version, and its tests in its `tests/` folder.

## Develop

```bash
pnpm install
pnpm test
pnpm build
pnpm --filter nano-app-site dev   # the documentation, from docs/
```

PostgreSQL tests run only when `DATABASE_URL` is set. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](https://github.com/Nano-Nathan/nano-app/blob/main/LICENSE) © Cristian Serrano.
