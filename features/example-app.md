---
status: todo
owner: null
depends_on: [typed-paths]
updated: 2026-10-24
---

# Example app

## Goal

An app built on the published `@nano-app/*` packages, as the reference for the apps that will be built on them.

## Scope

- A minimal app on the published backend, plugins and frontend, with backend and frontend.
- `backend/Dockerfile` and `frontend/Dockerfile`, built with the repository root as context.
- Where it lives (a folder of this repository or its own repository) is decided with the maintainer.

## Out of scope

The frontend release workflow (`publish-frontend.yml`, already on `main`). The `create-nano-app` template ([create-nano-app](create-nano-app.md)).

## Done when

The example app installs the published packages, starts, and both images build from the repository root.

## Log
