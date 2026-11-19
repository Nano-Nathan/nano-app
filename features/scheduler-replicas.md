---
status: todo
owner: null
depends_on: []
updated: 2026-11-18
---

# Scheduler replicas

## Goal

An app with more than one replica runs each firing of a job of the `scheduler` plugin once, not once per replica. Today the plugin runs its jobs in the process (`plugins/README.md`, scheduler): two replicas run each job twice. Taken only when an app asks; personal-app runs one replica today.

## Scope

- A `nano_scheduler` schema with a `runs` table: job name and scheduled time, unique together, plus start, end and status. Before running, each replica tries to insert its row (`INSERT ... ON CONFLICT DO NOTHING`); only the one that inserted runs the job. The same table is the history.
- Alternative without history: a Postgres advisory lock (`pg_try_advisory_lock`) per job name and firing, held while it runs. Cheaper, but it needs a session held for the whole run and leaves no trace.
- Its table lives in the `nano_scheduler` schema, through the plugin's own `database` (`relations`, `push`, `migrate`, see `backend/README.md`). It is the first official plugin with tables: a test must show that an empty database gets them, that a second start changes nothing, and that a change that loses data stops the startup (left here from the drizzle feature).
- A replica that is down at the firing time still loses the run if none is up (no catch-up), and a job that outlives its next firing needs a decision. Both stay out of scope.

## Done when

Two instances of a test app on the same database run a job with a one-second cron, and each firing runs once; the `runs` table holds one row per firing.

## Log

- 2026-11-18 · claude · Split from the scheduler feature, done in PR #156: the plugin runs its jobs in the process, one instance only.
