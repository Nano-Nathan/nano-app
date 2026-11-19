# Security model

What nano-app protects by default, and what is left to the app.

## By default

- **Closed when auth is on.** With Better Auth on, every route of the app and of every plugin needs a session. A route opens itself with `public: true`.
- **The backend is not public.** The browser only talks to the Next server. Backend URLs are read on the server and never reach the client bundle.
- **No credentials in the frontend.** The frontend forwards the browser's cookies and has no key of its own.
- **Errors do not leak.** An unexpected error answers `500 nano.error.internal` and is logged on the server, without its stack.
- **Logs skip query strings.** `morgan` logs the path without its query, so tokens sent there stay out of the logs.
- **Security headers.** `helmet` is on by default.

## Left to the app

- **What a body may bring.** `crud` writes any column a body sends until the app sets `validations`.
- **How much a list answers.** A `QUERY` of `crud` takes any `limit` (100 without one) unless a `read` validation caps it.
- **Who may sign up.** With `emailAndPassword`, anyone can sign up. Close it with `disableSignUp: true`.
- **Who may do what.** Roles and permissions come from Better Auth's admin plugin. Without Better Auth, `permissions` are not checked.
- **Rate limits.** `rateLimit` is off by default. Better Auth limits sign-in attempts in production on its own.

## Client IP

The rate limit and Better Auth count each client by IP. Behind a proxy, the IP of the request is the proxy's: the client's is in `X-Forwarded-For`.

- The backend trusts that header only from loopback and private networks, and takes the last address that is not one of them.
- The Next proxy passes the client IP in `X-Forwarded-For` only when the request brings none. Put a proxy in front of Next that sets it (nginx, an ingress, Tailscale Funnel).
- Anything on a private network can choose the IP it is counted by. Keep the backend reachable only from its proxies.

See [Deploy](/guides/deploy#behind-a-proxy) for the settings.

## Cookies through the proxy

The proxy forwards every header of the browser to the backend, cookies included. Point an api store only at a backend you trust with your users' cookies.
