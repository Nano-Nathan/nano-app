---
status: todo
owner: null
depends_on: [example-app]
updated: 2026-11-07
---

# Image contract

## Goal

Every app on nano-app produces images with the same contract, so they deploy without special cases.

## Scope

- Write the backend contract in the framework docs:
  - listens on `:3000`; probes on `/health` of `@nano-app/plugins/health`;
  - configured only by env at runtime (`DATABASE_URL` and the app's variables);
  - the app's schema is migrated by hand with Prisma (`prisma migrate deploy`) before starting the new version: startup migrates only the official plugins' schemas;
  - `backend/Dockerfile` and `frontend/Dockerfile`, built with the repository root as context.
- Write the frontend contract next to it:
  - listens on `:80`;
  - configured only by env at runtime (`API_<STORE>_URL`, `API_<VALUE>_HEADER`), with no `NEXT_PUBLIC_*` that depends on the environment.
- Requirements the cluster enforces, for both images:
  - run as a non-root user declared by numeric uid (`USER 1000`, not `USER node`): the deploy sets `runAsNonRoot`, and Kubernetes can only check a numeric user. The current chart pins uid 1000 (backend) and 1001 (frontend) to work around images that declare a name;
  - the backend writes nothing outside `/tmp` at runtime;
  - the base image is a supported Node LTS (Node 20 is out of support since 2026-04-30).

## Out of scope

Migrating the app's schema: the consumer does it with Prisma, not nano-app.

## Done when

The image of the [example app](example-app.md) meets the written contract: the backend listens on `:3000`, the frontend on `:80`, both are configured only by env, both run with `runAsNonRoot` and no `runAsUser` override, and the app's schema is migrated by hand with Prisma.

## Log

- 2026-10-24 · projects-thread · The frontend side (module 4 of the frontend feature) moved here when that feature closed.
- 2026-10-29 · kleo · `migrations` closed: nano-app has no `migrate` command. The consumer migrates the app's schema with Prisma; the startup migrates only the official plugins' schemas.
- 2026-11-07 · public-exposure · The image requirements of the cluster (numeric non-root uid, writes only in `/tmp`, Node LTS) moved here from public-exposure.
