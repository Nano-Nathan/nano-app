import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as wait } from 'node:timers/promises';
import { scheduledJobs } from 'croner';
import { startApp } from '../../backend/tests/helpers';
import scheduler from '../scheduler';

/** Every cron fires each second: two seconds and a half see at least two runs */
const EVERY_SECOND = '* * * * * *';

describe('scheduler', () => {
  // Stops the jobs of each test, so the next one starts without them
  afterEach(() => {
    for (const oJob of [...scheduledJobs]) oJob.stop();
  });

  test('a job runs on its cron, in an app with no routes', async () => {
    // An app with only the scheduler and a job every second
    let iRuns = 0;
    const oServer = await startApp([
      scheduler({ jobs: [{ name: 'tick', cron: EVERY_SECOND, run: () => iRuns++ }] }),
    ]);

    // It ran at least twice
    await wait(2500);
    assert.ok(iRuns >= 2, `${iRuns} runs`);
    await oServer.close();
  });

  test('a job that throws stops neither another job nor its own next run', async () => {
    // A job that always fails, beside one that works
    let iFailed = 0;
    let iRuns = 0;
    const oServer = await startApp([
      scheduler({
        jobs: [
          {
            name: 'broken',
            cron: EVERY_SECOND,
            run: async () => {
              iFailed++;
              throw new Error('broken');
            },
          },
          { name: 'tick', cron: EVERY_SECOND, run: () => iRuns++ },
        ],
      }),
    ]);

    // Both kept running
    await wait(2500);
    assert.ok(iFailed >= 2, `${iFailed} failed runs`);
    assert.ok(iRuns >= 2, `${iRuns} runs`);
    await oServer.close();
  });

  test('a run still going skips the next one', async () => {
    // A job that lasts longer than its cron
    let iStarted = 0;
    const oServer = await startApp([
      scheduler({
        jobs: [
          {
            name: 'slow',
            cron: EVERY_SECOND,
            run: async () => {
              iStarted++;
              await wait(5000);
            },
          },
        ],
      }),
    ]);

    // Only the first run started
    await wait(2500);
    assert.equal(iStarted, 1);
    await oServer.close();
  });

  test('the crons run in the timezone of the options', async () => {
    // Noon in Mendoza
    const oServer = await startApp([
      scheduler({
        timezone: 'America/Argentina/Mendoza',
        jobs: [{ name: 'noon', cron: '0 12 * * *', run: () => {} }],
      }),
    ]);

    // Is 15:00 UTC
    const oJob = scheduledJobs.find(oScheduled => oScheduled.name === 'noon');
    assert.equal(oJob?.nextRun()?.getUTCHours(), 15);
    await oServer.close();
  });
});
