import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request } from '../../backend/tests/helpers';
import health from '../health';

describe('health', () => {
  test('answers GET /health with status ok', async () => {
    // Starts an app with the plugin
    const oServer = await startApp([health()]);

    // Requests /health
    const { status, body } = await request(oServer.url, '/health');

    // Checks the answer
    assert.equal(status, 200);
    assert.deepEqual(body.result, { status: 'ok' });

    // Stops the server
    await oServer.close();
  });

  test('mounts on the given base path', async () => {
    // Starts an app with the plugin under /status
    const oServer = await startApp([health({ basePath: '/status' })]);

    // Checks that it answers there and not on /health
    assert.equal((await request(oServer.url, '/status')).status, 200);
    assert.equal((await request(oServer.url, '/health')).status, 404);

    // Stops the server
    await oServer.close();
  });
});
