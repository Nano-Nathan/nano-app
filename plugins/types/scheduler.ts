import type { NanoObject } from '@nano-app/backend';

/** A job of the scheduler: a function that runs on a cron */
export type SchedulerJob = {
  /** Name of the job, unique: its runs are logged with it */
  name: string;
  /** Cron pattern (`0 12 * * *`); a sixth field in front is the seconds (`30 0 12 * * *`) */
  cron: string;
  /** What it runs, with the params of a route callback: the plugin's `options` and `db` */
  run: (params: NanoObject) => unknown;
};

/** Options of the scheduler */
export type SchedulerOptions = {
  /** Jobs to run on their crons */
  jobs: SchedulerJob[];
  /** IANA timezone of every cron (`America/Argentina/Mendoza`), the process's by default */
  timezone?: string;
};
