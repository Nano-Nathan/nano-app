---
status: in-progress
owner: public-exposure
depends_on: []
updated: 2026-11-07
---

# Public exposure

## Goal

An app on nano-app can be published to the Internet as it is, whatever is in front of it (nothing, nginx, a load balancer, a CDN, Tailscale Funnel), with no WAF. The protection has to come from the framework: limits per client, stricter limits on sign-in, and security headers on every response, also the pages that Next serves.

## Scope

- Client IP. Every request reaches the backend from the frontend's proxy, so the rate limit sees one IP and all users share it. The proxy already forwards `X-Forwarded-For`; the backend trusts it only from loopback and private networks (`trust proxy`), and Better Auth gets the same networks (`advanced.ipAddress.trustedProxies`).
- Rate limit per client as a token bucket: each IP has a bucket of requests that empties with use and refills over time, instead of fixed windows. An official plugin (`@nano-app/plugins/rate-limit`) that the app adds if it wants; `packages.rateLimit` and `express-rate-limit` leave the backend.
- Stricter limit on sign-in and sign-up: Better Auth's own rate limit (on in production), which sees the client IP through `trustedProxies`.
- Security headers on the frontend. `helmet` only covers backend responses; the HTML and assets Next serves have none. Default headers for every app: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY`), and no `X-Powered-By`. The app can extend the CSP (e.g. an external image host) without replacing it.

## Out of scope

- A WAF or a reverse proxy in front of the app.
- Network isolation between the frontend, the backend and the database.
- Per-user quotas or limits stored in the database, and a rate-limit store shared between replicas.
- The image requirements (numeric non-root uid, writes only in `/tmp`, Node LTS): moved to [image-contract](image-contract.md).

## Modules

| Task | What it does | Depends on |
|---|---|---|
| client-ip | `trust proxy` and Better Auth's `trustedProxies` default to loopback and private networks | — |
| rate-limit | Plugin `rate-limit`: token bucket per IP; removes `packages.rateLimit` | client-ip |
| frontend-headers | Security headers on the pages Next serves, with an extensible CSP | — |

## Done when

Behind a private proxy, two clients with different IPs have separate counters, and a forged `X-Forwarded-For` from a public IP does not change the key; repeated failed sign-ins from one IP get `429` well before the global limit; and a page served by the example app carries the headers above.

## Log

- 2026-10-30 · cluster-audit · Opened from the cluster security audit: Funnel exposes the apps with no WAF, the global rate limit is shared through the frontend proxy, and the chart now runs the pods as non-root.
- 2026-11-07 · public-exposure · Decided: the backend trusts `X-Forwarded-For` only from loopback and private networks, by default and overridable (`settings`); Better Auth gets the same networks. Next fills `X-Forwarded-For` only when the request brings none, so an app must put a proxy in front of Next: documented, not solved in code. The rate limit becomes a token bucket in an official plugin, instead of `packages.rateLimit`. Sign-in limits are Better Auth's own. The image requirements moved to image-contract. client-ip in review.
