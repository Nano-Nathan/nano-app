---
status: in-progress
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
- When the check is green: `engines` and the README of both packages name Bun.

Out of scope: the frontend and the components (they run inside Next); a single executable (`bun build --compile`), which needs the routes imported from a generated file instead of found on disk and gives no speed over `bun src/app.ts`.

## Log

- 2026-11-11 · claude · Maintainer approved the check and declaring Bun once it passes. Branch `feat/bun-runtime` from `refactor/reuse-libraries`, pull request to that branch. Added `.github/workflows/bun.yml`. Missing: read its first run, fix what fails, `engines` and READMEs.
