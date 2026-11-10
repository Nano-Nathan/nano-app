import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { startApp, request } from '../../backend/tests/helpers';
import health from '../health';
import rateLimit from '../rate-limit';

describe('rate-limit', () => {
  test('a client that spends its bucket gets 429 with the seconds to wait', async () => {
    // Starts an app whose clients have two requests
    const oServer = await startApp([rateLimit({ capacity: 2, message: 'Slow down' }), health()]);

    // Sends three requests from the same client
    const aResponses = [
      await request(oServer.url, '/health'),
      await request(oServer.url, '/health'),
      await request(oServer.url, '/health'),
    ];
    await oServer.close();

    // Checks that the third is limited, with its message and Retry-After
    assert.deepEqual(
      aResponses.map(oResponse => oResponse.status),
      [200, 200, 429],
    );
    assert.equal(aResponses[2].body.message, 'Slow down');
    assert.equal(aResponses[2].headers.get('retry-after'), '1');
  });

  test('the bucket refills over time', async () => {
    // Starts an app whose clients have one request, refilled 20 times per second
    const oServer = await startApp([rateLimit({ capacity: 1, refillPerSecond: 20 }), health()]);

    // Spends the request, is limited, and passes again once a token is back
    const iFirst = (await request(oServer.url, '/health')).status;
    const iLimited = (await request(oServer.url, '/health')).status;
    await setTimeout(100);
    const iRefilled = (await request(oServer.url, '/health')).status;
    await oServer.close();

    // Checks the three statuses
    assert.deepEqual([iFirst, iLimited, iRefilled], [200, 429, 200]);
  });

  test('the addresses of an IPv6 network share one bucket', async () => {
    // Starts an app whose clients have one request
    const oServer = await startApp([rateLimit({ capacity: 1 }), health()]);

    // Sends a request from two addresses of the same /56, behind a trusted proxy
    const aStatuses = [];
    for (const sIp of ['2001:db8:0:1::1', '2001:db8:0:2::1']) {
      const oResponse = await request(oServer.url, '/health', {
        headers: { 'X-Forwarded-For': sIp },
      });
      aStatuses.push(oResponse.status);
    }
    await oServer.close();

    // Checks that the second address is limited
    assert.deepEqual(aStatuses, [200, 429]);
  });
});
