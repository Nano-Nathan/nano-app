---
status: todo
owner: null
depends_on: []
updated: 2026-11-13
---

# Rebuild the official plugins

Starts when the responsibilities refactor (`refactor/responsibilities`: database, auth, plugins) is merged.

## Goal

The official plugins (`crud`, `health`) are written again on the backend as the refactor leaves it, with nothing repeated by the consumer.

## Known issues

- `crud` needs the app's schema twice: the app passes it to `database.relations` and again to `crud({ dbSchema })`. The plugin should get the tables from what the app already gives, without reading private members of the client (`db._`).
- `crud` must reach only the app's tables: Better Auth's live in `nano_auth`, outside the app's client, and must stay out of it.

## Log

- 2026-11-13 · claude · Written during the database part of the refactor: the `dbSchema` repetition of `crud` is left to this feature.
