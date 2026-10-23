---
status: todo
owner: null
depends_on: [frontend, typed-paths]
updated: 2026-10-23
---

# Example app

## Goal

An app built on the published `@nano-app/*` packages, as the reference for the apps that will be built on them.

## Scope

- A minimal app on the published backend, plugins and frontend, with backend and frontend.
- `backend/Dockerfile` and `frontend/Dockerfile`, built with the repository root as context.
- Where it lives (a folder of this repository or its own repository) is decided with the maintainer.

## Out of scope

The frontend release workflow ([frontend](frontend.md), module 5). The `create-nano-app` template ([create-nano-app](create-nano-app.md)).

## Done when

The example app installs the published packages, starts, and both images build from the repository root.

## Log
