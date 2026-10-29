---
status: todo
owner: null
depends_on: []
updated: 2026-10-28
---

# Scheduler

## Goal

An app runs functions on a cron schedule, declared as options of an official plugin, instead of its own `node-schedule` wiring.

## Scope

- An official plugin, `import scheduler from '@nano-app/plugins/scheduler'`, with `node-schedule` underneath. `scheduler({ jobs, timezone })`, where each job is `{ name, cron, run }`:

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

- `run` receives the same `params` as a route callback (the plugin's `options`, `db`). The jobs start in `callbacks.onMount`, once, and are registered in `node-schedule` under their `name`.
- `timezone` is an IANA name passed to the rule of each job. Without it, the process timezone applies, as in `node-schedule`.
- A job that throws or rejects is logged with its name and does not stop its next firing or the other jobs. Each run logs its start and its end with the job name.
- A plugin may have no routes: the scheduler runs functions and answers nothing over HTTP. Today `routesDir` is required by the `PluginConfig` type (`backend/src/types/plugin.ts`, no `?`) and only by the type: `routes/Plugin.ts` passes it to `Router`, which loads routes only when it is a non-empty string (the tests use `routesDir: ''`). So `routesDir` becomes optional: `routesDir?: string` in `PluginConfig` with its doc comment saying a plugin without it mounts no routes (like `MainPluginConfig`), a test in `backend/tests/plugins.test.ts` that a plugin with only `name` and `callbacks.onMount` mounts and its `onMount` runs, and a line in `PLUGINS.md` and `backend/README.md`. It is a minor change for the backend, with no behavior change for plugins that set it. [mail](mail.md) uses it too when its route is off, so it depends on this feature.
- No database and no migrations: the jobs are in code and run in the process. It means a run is lost if the process is down at the firing time, and two instances of the same app run each job twice. A `nano_scheduler` schema with a `runs` table (job and scheduled time, unique) would give one run per firing across instances and a history, at the cost of a migration and a write per run. personal-app runs one replica today, so the scope is one instance; what changes with more is in [Future: multiple replicas](#future-multiple-replicas).

## Out of scope

Persistence, catch-up of missed runs, locks between instances (see [Future: multiple replicas](#future-multiple-replicas)). Jobs added or removed at runtime, and an HTTP API to list or trigger them (personal-app triggers its mails from its own route). Retries and backoff.

## Future: multiple replicas

Not in scope. personal-app runs one replica today but may scale, and then every replica would fire every job. What it would take, when an app asks:

- A `nano_scheduler` schema with a `runs` table: job name and scheduled time, unique together, plus start, end and status. Before running, each replica tries to insert its row (`INSERT ... ON CONFLICT DO NOTHING`); only the one that inserted runs the job. The same table is the history.
- Alternative without history: a Postgres advisory lock (`pg_try_advisory_lock`) per job name and firing, held while it runs. Cheaper, but it needs a session held for the whole run and leaves no trace.
- It depends on [migrations](migrations.md): the table is a schema of the plugin, applied by `migrate` with the app's, and the plugin needs `database` in its config.
- A replica that is down at the firing time still loses the run if none is up (no catch-up), and a job that outlives its next firing needs a decision. Both stay out of scope there too.
- Until then, the app either runs one replica or runs the scheduler in a single process of its own.

## Done when

`plugins/tests` covers it: a job with a one-second cron runs at least twice; a job that throws does not stop another job nor its own next firing; with `timezone: 'America/Argentina/Mendoza'` the next invocation of `0 12 * * *` is at 15:00 UTC. A test app lists `scheduler()` without `routesDir` and a job runs. The README of `plugins/` documents the options and the single-instance limit.

## Notes

- Where personal-app is today (`/home/node/projects/nano-app/personal-app`, branch `prd`): `backend/src/lib/App.ts` defines `class Scheduler extends SendMailsEndpoint` (the scheduler inherits the mail endpoint to reach `sendMails`), and `backend/src/app.ts` calls `Scheduler.initialize()` at startup.
- It registers three jobs with the same function: `0 15 25 * *`, `0 15 1 * *` and `0 15 10 * *`. Its comments say 12:00, which holds only when the server runs in UTC (15:00 UTC is 12:00 in Argentina): hence the explicit `timezone`.
- It passes `this.scheduleFn` to `scheduleJob` unbound, and `node-schedule` calls it with its own `this`, so `this.sendMails` is probably undefined when it fires. Not verified; the plugin passes plain functions, so the problem does not carry over.
- `backend/package.json` has `node-schedule ^2.1.1`: use the same major in `plugins/`.
- Moving personal-app onto the plugin is not tracked here (see `features/README.md`).

## Log
