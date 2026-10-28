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
- No database and no migrations: the jobs are in code and run in the process. It means a run is lost if the process is down at the firing time, and two instances of the same app run each job twice. A `nano_scheduler` schema with a `runs` table (job and scheduled time, unique) would give one run per firing across instances and a history, at the cost of a migration and a write per run. personal-app is one instance and today has neither, so it is left out until an app runs more than one.
- To decide with the maintainer: whether personal-app runs more than one replica (it would move the table above into scope), and the same question as [mail](mail.md) about a plugin without routes.

## Out of scope

Persistence, catch-up of missed runs, locks between instances. Jobs added or removed at runtime, and an HTTP API to list or trigger them (personal-app triggers its mails from its own route). Retries and backoff.

## Done when

`plugins/tests` covers it: a job with a one-second cron runs at least twice; a job that throws does not stop another job nor its own next firing; with `timezone: 'America/Argentina/Mendoza'` the next invocation of `0 12 * * *` is at 15:00 UTC. A test app lists `scheduler()` and a job runs. The README of `plugins/` documents the options and the single-instance limit.

## Notes

- Where personal-app is today (`/home/node/projects/nano-app/personal-app`, branch `prd`): `backend/src/lib/App.ts` defines `class Scheduler extends SendMailsEndpoint` (the scheduler inherits the mail endpoint to reach `sendMails`), and `backend/src/app.ts` calls `Scheduler.initialize()` at startup.
- It registers three jobs with the same function: `0 15 25 * *`, `0 15 1 * *` and `0 15 10 * *`. Its comments say 12:00, which holds only when the server runs in UTC (15:00 UTC is 12:00 in Argentina): hence the explicit `timezone`.
- It passes `this.scheduleFn` to `scheduleJob` unbound, and `node-schedule` calls it with its own `this`, so `this.sendMails` is probably undefined when it fires. Not verified; the plugin passes plain functions, so the problem does not carry over.
- `backend/package.json` has `node-schedule ^2.1.1`: use the same major in `plugins/`.
- Moving personal-app onto the plugin is not tracked here (see `features/README.md`).

## Log
