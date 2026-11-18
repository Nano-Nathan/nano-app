---
status: in-progress
owner: claude
depends_on: [example-app]
updated: 2026-11-18
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

An app created with `pnpm create @nano-app` installs, starts and builds both of its images in CI.

## Modules

| # | Task | Does | Done when | Depends on |
|---|---|---|---|---|
| 1 | The command | `@nano-app/create` in `create/`: a bin that copies the template to `<name>`, names its root `package.json` and renames `gitignore` | Its `node:test` suite creates an app in a temporary folder and checks its files | — |
| 2 | The template inside | The build copies `../template` beside the command, without what an install writes | `pnpm pack` holds the template | 1 |
| 3 | Release | `publish-create.yml` and `.releaserc.json`; the maintainer bootstraps the package on npm | The merge publishes its first version | 2 |
| 4 | End to end in CI | `test-create` creates an app, installs it, builds its frontend and both images | The check passes on the pull request | 2 |

## Decisions

Decided 2026-11-18: 1A `@nano-app/create` (`create-nano-app` belongs to another author on npm), 2A the template travels inside the package, 3A the app has no database, so the done-when drops "migrates".

## Log

- 2026-10-29 · kleo · `migrations` closed: nano-app has no `migrate` command. The consumer migrates the app's schema with Prisma; the startup migrates only the official plugins' schemas.
- 2026-11-18 · claude · Modules 1 to 4 on `feat/create`, one pull request: the template is copied in the `build:done` hook of tsdown with `cpSync` (its `copy` option nests the folder, drops extensions and skips dotfiles). Tests run only in CI.
