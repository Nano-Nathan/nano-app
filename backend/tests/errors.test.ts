import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request } from './helpers';

describe('error handling', () => {
  let oServer: Awaited<ReturnType<typeof startApp>>;

  before(async () => {
    oServer = await startApp();
  });

  after(async () => {
    await oServer.close();
  });

  test('a throw with status and message becomes an ApiResponse', async () => {
    // Requests the route that throws { status, message }
    const { status, body } = await request(oServer.url, '/throw/object');

    // Checks the status and the ApiResponse
    assert.equal(status, 409);
    assert.deepEqual(body, { success: false, warning: false, message: 'Already exists' });
  });

  test('a thrown string answers 400 with the text as message', async () => {
    // Requests the route that throws a string
    const { status, body } = await request(oServer.url, '/throw/string');

    // Checks that the string is the message of a 400
    assert.equal(status, 400);
    assert.deepEqual(body, { success: false, message: 'Field name is required' });
  });

  test('an Error without status answers 500 with its message', async () => {
    // Requests the route that throws an Error
    const { status, body } = await request(oServer.url, '/throw/error');

    // Checks that it is a 500 with the Error's message
    assert.equal(status, 500);
    assert.equal(body.success, false);
    assert.equal(body.message, 'boom');
  });

  test('the warning flag goes in the response', async () => {
    // Requests the route that throws a warning
    const { status, body } = await request(oServer.url, '/throw/warning');

    // Checks the status and the flag
    assert.equal(status, 422);
    assert.equal(body.warning, true);
  });

  test('a path without a route becomes a 404', async () => {
    // Requests a path with no route
    const { status, body } = await request(oServer.url, '/missing');

    // Checks the 404 ApiResponse
    assert.equal(status, 404);
    assert.deepEqual(body, { success: false, warning: false, message: '/missing not found' });
  });
});
