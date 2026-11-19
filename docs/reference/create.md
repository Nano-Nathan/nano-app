# @nano-app/create

Creates an app on nano-app: a backend and a frontend in one pnpm workspace, on the published packages.

```bash
pnpm create @nano-app my-app
```

- The name is the folder of the app and the `name` of its root `package.json`: lowercase, digits, `.`, `_` and `-`.
- A folder that already exists stops the command.
- Dependencies take the latest versions of their ranges at `pnpm install`.

## The app

| Folder      | What it is                                                       | Port                             |
| ----------- | ---------------------------------------------------------------- | -------------------------------- |
| `backend/`  | `createNanoApp` with `GET /health` of `@nano-app/plugins/health` | `3000`                           |
| `frontend/` | Next with `@nano-app/frontend` and `@nano-app/mantine`: one page | `3001` in dev, `80` in its image |

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm install` | Installs, and writes `pnpm-lock.yaml`.       |
| `pnpm dev`     | Runs both halves, reloading on every change. |
| `pnpm build`   | Builds both halves.                          |

`.env` at the root serves both halves: `API_API_URL` is the URL of the backend.

## Images

```bash
docker build -f backend/Dockerfile .
docker build -f frontend/Dockerfile .
```

- The context is the root of the app, and `pnpm-lock.yaml` is required.
- Configured only by env at runtime: `API_API_URL` for the frontend.
- Both run as a non-root user by uid: `1000` the backend, `1001` the frontend.
