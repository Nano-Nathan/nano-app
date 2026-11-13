import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { boot, request } from './helpers';
import type { Booted } from './helpers';

/** Sends requests to /health in a row, from the given addresses, and stops the app */
async function statuses(oApp: Booted, aForwardedFor: string[]): Promise<number[]> {
  const aStatuses = [];
  for (const sIp of aForwardedFor) {
    const oResponse = await request(oApp.url, '/health', { headers: { 'X-Forwarded-For': sIp } });
    aStatuses.push(oResponse.status);
  }
  return aStatuses;
}

describe('rate limit', () => {
  test('a client that spends its bucket gets 429 with the seconds to wait', async () => {
    // Boots an app whose clients have two requests
    const oApp = await boot({ packages: { rateLimit: { capacity: 2, message: 'Slow down' } } });

    // Sends three requests from the same client
    const aResponses = [];
    for (const _iTry of [1, 2, 3]) aResponses.push(await request(oApp.url, '/health'));
    oApp.child.kill('SIGKILL');

    // Checks that the third is limited, with its message and Retry-After
    assert.deepEqual(
      aResponses.map(oResponse => oResponse.status),
      [200, 200, 429],
    );
    assert.equal(aResponses[2].body.message, 'Slow down');
    assert.equal(aResponses[2].headers.get('retry-after'), '1');
  });

  test('the bucket refills over time', async () => {
    // Boots an app whose clients have one request, refilled 20 times per second
    const oApp = await boot({ packages: { rateLimit: { capacity: 1, refillPerSecond: 20 } } });

    // Spends the request, is limited, and passes again once a token is back
    const aStatuses = await statuses(oApp, ['203.0.113.1', '203.0.113.1']);
    await setTimeout(100);
    aStatuses.push(...(await statuses(oApp, ['203.0.113.1'])));
    oApp.child.kill('SIGKILL');

    // Checks the three statuses
    assert.deepEqual(aStatuses, [200, 429, 200]);
  });

  test('the addresses of an IPv6 network share one bucket', async () => {
    // Boots an app whose clients have one request
    const oApp = await boot({ packages: { rateLimit: { capacity: 1 } } });

    // Sends a request from two addresses of the same /56, behind a trusted proxy
    const aStatuses = await statuses(oApp, ['2001:db8:0:1::1', '2001:db8:0:2::1']);
    oApp.child.kill('SIGKILL');

    // Checks that the second address is limited
    assert.deepEqual(aStatuses, [200, 429]);
  });
});
