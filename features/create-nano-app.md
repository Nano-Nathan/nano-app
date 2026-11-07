---
status: todo
owner: null
depends_on: [example-app]
updated: 2026-10-29
---

# create-nano-app

## Goal

A new app starts with one command, with what the first apps showed is needed.

## Scope

- `create-nano-app` generates the skeleton: `src/routes`, `src/stores`, `next.config` with `withNanoApp`, the base configuration, `backend/Dockerfile` and `frontend/Dockerfile` (repository root as context, see [image-contract](image-contract.md)).
- Published from this repository like the other packages, with its own release workflow.
- It goes last on purpose: the template is built with what the apps on nano-app taught.

## Out of scope

The image build workflow (outside this repository).

## Done when

An app generated with `create-nano-app` starts, migrates and builds its images.

## Log

- 2026-10-29 · kleo · `migrations` closed: nano-app has no `migrate` command. The consumer migrates the app's schema with Prisma; the startup migrates only the official plugins' schemas.
