# Deploy

An app from `pnpm create @nano-app` has a Dockerfile per half. Use this to build the images and run them behind a proxy.

## Build the images

From the root of the app:

```bash
pnpm install          # writes pnpm-lock.yaml, which the images need
docker build -f backend/Dockerfile -t notes-backend .
docker build -f frontend/Dockerfile -t notes-frontend .
```

Both run as a non-root user declared by its uid (`1000` the backend, `1001` the frontend), so Kubernetes can check `runAsNonRoot`.

## Configure them

Both are configured only by environment variables at runtime.

| Image    | Variable             | Value                                     |
| -------- | -------------------- | ----------------------------------------- |
| frontend | `API_API_URL`        | The URL of the backend, reachable from it |
| backend  | `DATABASE_URL`       | With a database or Better Auth            |
| backend  | `BETTER_AUTH_SECRET` | With Better Auth                          |
| backend  | `BETTER_AUTH_URL`    | With Better Auth                          |

The frontend listens on `80`, the backend on `3000`.

## Expose only the frontend

The browser only talks to the frontend. Keep the backend on a private network, reachable from the frontend alone.

## Behind a proxy

Put a proxy in front of the frontend that appends the client IP to `X-Forwarded-For` (an ingress, nginx, a load balancer). The backend trusts that header from private networks by default.

- A public proxy in front (a CDN): set its addresses in `settings['trust proxy']` of `createNanoApp`, and in Better Auth's `advanced.ipAddress.trustedProxies`.
- No proxy you trust: `settings: { 'trust proxy': false }` and `advanced.ipAddress.trustedProxies: []`.

## Turn off what the proxy does

The proxy in front usually logs and compresses. Save the cost in the backend:

```ts
createNanoApp({ packages: { morgan: false } });
```

`compression` is already off.

## Cookie cache

Each page with `createPage` asks the backend for the session. Let Better Auth keep it in its cookie, so it does not read the database each time:

```ts
auth: { session: { cookieCache: { enabled: true, maxAge: 300 } } },
```

**Background:** [Security model](/concepts/security).
