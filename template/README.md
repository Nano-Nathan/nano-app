# app

An app on [nano-app](https://github.com/Nano-Nathan/nano-app): a backend and a frontend in one pnpm workspace.

| Folder | What it is | Port |
| --- | --- | --- |
| `backend/` | `createNanoApp` of `@nano-app/backend`, with `GET /health` of `@nano-app/plugins/health` | `3000` |
| `frontend/` | Next with `@nano-app/frontend` and `@nano-app/mantine`: one page that says Hello World | `3001` in dev, `80` in its image |

## Commands

```bash
pnpm install           # also writes pnpm-lock.yaml, which the images need
cp .env.example .env   # API_API_URL: the URL of the backend
pnpm dev               # backend on :3000, frontend on :3001
```

## Images

`backend/Dockerfile` and `frontend/Dockerfile` build with the repository root as context:

```bash
docker build -f backend/Dockerfile .
docker build -f frontend/Dockerfile .
```

- Configured only by env at runtime: `API_API_URL` for the frontend.
- Both run as a non-root user declared by its uid (`1000` the backend, `1001` the frontend), so Kubernetes can check `runAsNonRoot` with no `runAsUser`.
