---
status: todo
owner: null
depends_on: [migrations, example-app]
updated: 2026-10-24
---

# Image contract

## Goal

Every app on nano-app produces images with the same contract, so they deploy without special cases.

## Scope

- Write the backend contract in the framework docs:
  - listens on `:3000`; no `/health` and no probes for now (they come when the framework exposes them);
  - configured only by env at runtime (`DATABASE_URL` and the app's variables);
  - the `migrate` script ([migrations](migrations.md)) is run by hand before starting the new version: startup does not migrate;
  - `backend/Dockerfile` and `frontend/Dockerfile`, built with the repository root as context.
- Write the frontend contract next to it:
  - listens on `:80`;
  - configured only by env at runtime (`API_<STORE>_URL`, `API_<VALUE>_HEADER`), with no `NEXT_PUBLIC_*` that depends on the environment.

## Out of scope

The `migrate` command itself ([migrations](migrations.md)).

## Done when

The image of the [example app](example-app.md) meets the written contract: the backend listens on `:3000`, the frontend on `:80`, both are configured only by env, and the backend migrates with `pnpm migrate` by hand.

## Log

- 2026-10-24 · projects-thread · The frontend side (module 4 of the frontend feature) moved here when that feature closed.
