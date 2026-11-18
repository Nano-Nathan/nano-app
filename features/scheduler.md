---
status: review
owner: claude
depends_on: []
updated: 2026-11-18
---

# Scheduler

## Goal

An app runs functions on a cron schedule, declared as options of an official plugin, instead of its own `node-schedule` wiring.

## Scope

- An official plugin, `import scheduler from '@nano-app/plugins/scheduler'`, with `croner` underneath. `scheduler({ jobs, timezone })`, where each job is `{ name, cron, run }`:

  ```ts
  scheduler({
    timezone: 'America/Argentina/Mendoza',
    jobs: [
      {
        name: 'debt-mails',
        cron: '0 12 25,1,10 * *',
        run: async params => {
          /* ... */
        },
      },
    ],
  });
  ```

- `run` receives the same `params` as a route callback (the plugin's `options`, `db`). The jobs start in `callbacks.onMount`, once, and are registered in `croner` under their `name`: two jobs of the same name stop the startup.
- `timezone` is an IANA name passed to the cron of each job. Without it, the process timezone applies.
- A job that throws or rejects is logged with its name and does not stop its next firing or the other jobs. Each run logs its start and its end with the job name.
- A plugin may have no routes: the scheduler runs functions and answers nothing over HTTP. `routesDir` is already optional in `PluginConfig`, so the backend does not change for it. [mail](mail.md) relies on the same when its route is off.
- A job reaches the logic of a route through a function the `*.route.ts` exports beside its default (`export async function sendMails(db)`), which the route's handler uses too. The router reads only the default export; `backend/README.md` says so and `backend/tests/routing.test.ts` covers it.
- No database and no migrations: the jobs are in code and run in the process. It means a run is lost if the process is down at the firing time, and two instances of the same app run each job twice. A `nano_scheduler` schema with a `runs` table (job and scheduled time, unique) would give one run per firing across instances and a history, at the cost of a migration and a write per run. personal-app runs one replica today, so the scope is one instance; what changes with more is in [Future: multiple replicas](#future-multiple-replicas).

## Out of scope

Persistence, catch-up of missed runs, locks between instances (see [Future: multiple replicas](#future-multiple-replicas)). Jobs added or removed at runtime, and an HTTP API to list or trigger them (personal-app triggers its mails from its own route). Retries and backoff.

## Future: multiple replicas

Not in scope. personal-app runs one replica today but may scale, and then every replica would fire every job. What it would take, when an app asks:

- A `nano_scheduler` schema with a `runs` table: job name and scheduled time, unique together, plus start, end and status. Before running, each replica tries to insert its row (`INSERT ... ON CONFLICT DO NOTHING`); only the one that inserted runs the job. The same table is the history.
- Alternative without history: a Postgres advisory lock (`pg_try_advisory_lock`) per job name and firing, held while it runs. Cheaper, but it needs a session held for the whole run and leaves no trace.
- Its table lives in the `nano_scheduler` schema, through the plugin's own `database` (`relations`, `push`, `migrate`, see `backend/README.md`). It is the first official plugin with tables: a test must show that an empty database gets them, that a second start changes nothing, and that a change that loses data stops the startup (left here from the drizzle feature).
- A replica that is down at the firing time still loses the run if none is up (no catch-up), and a job that outlives its next firing needs a decision. Both stay out of scope there too.
- Until then, the app either runs one replica or runs the scheduler in a single process of its own.

## Done when

`plugins/tests` covers it: a job with a one-second cron runs at least twice; a job that throws does not stop another job nor its own next firing; with `timezone: 'America/Argentina/Mendoza'` the next invocation of `0 12 * * *` is at 15:00 UTC. A test app lists `scheduler()` without `routesDir` and a job runs. The README of `plugins/` documents the options and the single-instance limit.

## Notes

- Where personal-app is today (`/home/node/projects/nano-app/personal-app`, branch `prd`): `backend/src/lib/App.ts` defines `class Scheduler extends SendMailsEndpoint` (the scheduler inherits the mail endpoint to reach `sendMails`), and `backend/src/app.ts` calls `Scheduler.initialize()` at startup.
- It registers three jobs with the same function: `0 15 25 * *`, `0 15 1 * *` and `0 15 10 * *`. Its comments say 12:00, which holds only when the server runs in UTC (15:00 UTC is 12:00 in Argentina): hence the explicit `timezone`.
- It passes `this.scheduleFn` to `scheduleJob` unbound, and `node-schedule` calls it with its own `this`, so `this.sendMails` is probably undefined when it fires. Not verified; the plugin passes plain functions, so the problem does not carry over.
- Moving personal-app onto the plugin is not tracked here (see `features/README.md`).

## Decisions

Decided 2026-11-18: 1A `croner` instead of `node-schedule` (no dependencies, native timezones, `nextRun()`, `catch` and `protect`), a dependency of `@nano-app/plugins`; 2A a run still going skips the next one, with a warning.

## Log

- 2026-10-29 · kleo · `migrations` closed without a `migrate` command: the plugin's table is migrated at startup, as an official plugin.
- 2026-11-18 · claude · From the drizzle feature, closed: the tables of an official plugin by push (`database` of the plugin) are checked with the first plugin that has them, this one when it adds `runs`.
- 2026-11-18 · claude · Done on `feat/scheduler`: `scheduler({ jobs, timezone })` on croner, its tests in `plugins/tests/scheduler.test.ts` (runs every second, a failing job beside a working one, a run that skips the next, noon in Mendoza at 15:00 UTC, in an app with no routes) and its section in `plugins/README.md`. `routesDir` was already optional. Tests run only in CI.
- 2026-11-18 · claude · Spec aligned with croner and `routesDir` already optional; a route file may export functions beside its default, documented in `backend/README.md` and tested, so a job calls a route's logic.
