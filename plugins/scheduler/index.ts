import { Cron } from 'croner';
import { createPlugin } from '@nano-app/backend';
import Logger from '@nano-app/core/utils/Logger';
import type { NanoObject } from '@nano-app/backend';
import type { SchedulerJob, SchedulerOptions } from '../types/scheduler';

/** One run of a job, between its start and its end on the console */
async function run(oJob: SchedulerJob, oParams: NanoObject): Promise<void> {
  Logger.info(`Job ${oJob.name}: started`);
  await oJob.run(oParams);
  Logger.info(`Job ${oJob.name}: done`);
}

/** Scheduler: runs each job of `jobs` on its cron, in `timezone`, with no routes */
export default createPlugin((options?: SchedulerOptions) => ({
  name: 'scheduler',
  options,
  callbacks: {
    onMount: async oParams => {
      // One cron per job: a failure is logged and the next runs go on, and a run
      // still going skips the next one; the HTTP server keeps the process alive
      for (const oJob of options?.jobs ?? [])
        new Cron(
          oJob.cron,
          {
            name: oJob.name,
            timezone: options?.timezone,
            unref: true,
            catch: oError => Logger.error(`Job ${oJob.name}: failed`, oError),
            protect: () => Logger.warn(`Job ${oJob.name}: skipped, its last run is still going`),
          },
          () => run(oJob, oParams),
        );
    },
  },
}));
