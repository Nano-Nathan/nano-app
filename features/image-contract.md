---
status: todo
owner: null
depends_on: [migrations, example-app]
updated: 2026-10-23
---

# Image contract

## Goal

Every app on nano-app produces images with the same contract, so they deploy without special cases.

## Scope

- Write the backend contract in the framework docs, next to the frontend's ([frontend](frontend.md), module 4):
  - listens on `:3000`; no `/health` and no probes for now (they come when the framework exposes them);
  - configured only by env at runtime (`DATABASE_URL` and the app's variables);
  - the `migrate` script ([migrations](migrations.md)) is run by hand before starting the new version: startup does not migrate;
  - `backend/Dockerfile` and `frontend/Dockerfile`, built with the repository root as context.

## Out of scope

The `migrate` command itself ([migrations](migrations.md)). The frontend side ([frontend](frontend.md)).

## Done when

The image of the [example app](example-app.md) meets the written contract: listens on `:3000`, is configured only by env and migrates with `pnpm migrate` by hand.

## Log
