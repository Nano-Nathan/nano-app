---
status: review
owner: claude
depends_on: [reuse-libraries]
updated: 2026-11-11
---

# Bun as a runtime of the backend

## Goal

An app on `@nano-app/backend` and `@nano-app/plugins` runs on Bun as it runs on Node.js, and the packages say so. Measured on the quick start of the backend README (one route, no database, 50 connections, 10 s): Bun 1.4.4 answers about 18,500 requests per second with 90 MB, Node.js 22.23.4 about 4,600 with 184 MB.

## Scope

- A `test-bun` check runs the suites of the backend and the plugins on Bun (`bun test` runs their `node:test` files), with PostgreSQL and Better Auth.
- What fails on Bun is fixed in the framework, each change of behavior decided by the maintainer first.
- When the check is green: `engines` of both packages and the README of the backend name Bun.

Out of scope: the frontend and the components (they run inside Next); a single executable (`bun build --compile`), which needs the routes imported from a generated file instead of found on disk and gives no speed over `bun src/app.ts`.

## Log

- 2026-11-11 · claude · Maintainer approved the check and declaring Bun once it passes. Branch `feat/bun-runtime` from `refactor/reuse-libraries`, pull request to that branch. Added `.github/workflows/bun.yml`. Missing: read its first run, fix what fails, `engines` and READMEs.
- 2026-11-11 · claude · First run on Bun 1.4.4: backend 55 of 55. Plugins need one process per file, as Node.js runs them (in one process the DOM of `crud-e2e` leaks into the other files). `crud-e2e` is left out of the check: happy-dom's `fetch` throws `ERR_INVALID_HTTP_TOKEN` on Bun, and it tests the frontend, out of scope. `engines` of both packages and the backend README name Bun 1.4.4 and newer.
