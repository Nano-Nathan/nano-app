---
status: todo
owner: null
depends_on: []
updated: 2026-10-30
---

# Public exposure

## Goal

An app on nano-app can be published to the Internet as it is. Tailscale Funnel puts the frontend on the Internet with no WAF in front of it, so the protection has to come from the framework: limits per client, stricter limits on sign-in, and security headers on every response, also the pages that Next serves.

## Scope

- Rate limit per real client. `helmet` and the global `rateLimit` (`max: 1000`) already exist in `backend/src/app/config.ts`, but every request reaches the backend from the frontend's proxy, so the limit sees one IP and all users share it. The frontend proxy (`frontend/src/proxy.ts`) forwards the client address (`X-Forwarded-For`), and the backend trusts exactly that hop (`trust proxy`), so `express-rate-limit` keys by the user's IP. A request that does not come through the proxy cannot spoof the header.
- Stricter limit on sign-in and sign-up. A separate, lower limit on the Better Auth routes (password sign-in, sign-up, password reset), keyed by the same client IP. Use the rate limit of Better Auth itself if it covers it; otherwise a second `rateLimit` mounted on those paths.
- Security headers on the frontend. `helmet` only covers backend responses; the HTML and assets Next serves have none. Default headers for every app: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY`), and no `X-Powered-By`. The app can extend the CSP (e.g. an external image host) without replacing it.
- Image requirements that the cluster now enforces (link them from [image-contract](image-contract.md)):
  - both images run as a non-root user declared by numeric uid (`USER 1000`, not `USER node`): the deploy sets `runAsNonRoot`, and Kubernetes can only check a numeric user. The current chart pins uid 1000 (backend) and 1001 (frontend) to work around images that declare a name;
  - the backend writes nothing outside `/tmp` at runtime;
  - the base image is a supported Node LTS (Node 20 is out of support since 2026-04-30).

## Out of scope

- A WAF or a reverse proxy in front of Funnel.
- Network isolation between pods: the cluster chart does it with NetworkPolicies (frontend → backend → Postgres, plus DNS and public Internet).
- Per-user quotas or limits stored in the database.

## Done when

Behind the frontend proxy, two clients with different IPs have separate rate-limit counters and a spoofed `X-Forwarded-For` sent straight to the backend does not change the key; repeated failed sign-ins from one IP get `429` well before the global limit; a page served by the example app carries the headers above; and the example app's images run with `runAsNonRoot` and no `runAsUser` override.

## Log

- 2026-10-30 · cluster-audit · Opened from the cluster security audit: Funnel exposes the apps with no WAF, the global rate limit is shared through the frontend proxy, and the chart now runs the pods as non-root.
