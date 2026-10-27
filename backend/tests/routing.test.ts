import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request } from './helpers';

describe('file path to express path', () => {
  // [routesDir, basePath, a path the route answers]
  const aCases: [string, string | undefined, string][] = [
    ['tests/fixtures/paths/index', undefined, '/'],
    ['tests/fixtures/paths/index-expression', undefined, '/users'],
    ['tests/fixtures/paths/plain', undefined, '/service/test/7'],
    ['tests/fixtures/paths/index', '/demo', '/demo'],
    ['tests/fixtures/paths/plain', '/demo', '/demo/service/test/7'],
    ['tests/fixtures/paths/index-expression', '/demo', '/demo/users'],
  ];

  // One test per case
  for (const [sRoutesDir, sBasePath, sPath] of aCases) {
    test(`${sRoutesDir.split('/').pop()} + base ${sBasePath ?? '-'} answers ${sPath}`, async () => {
      // Starts an app with the routes
      const oServer = await startApp([{ routesDir: sRoutesDir, basePath: sBasePath }]);

      // Checks that the route answers the path
      assert.equal((await request(oServer.url, sPath)).status, 200);

      // Stops the server
      await oServer.close();
    });
  }
});

describe('routes by file convention', () => {
  let oServer: Awaited<ReturnType<typeof startApp>>;

  before(async () => {
    oServer = await startApp();
  });
  after(async () => {
    await oServer.close();
  });

  test('index.route.ts is mounted on /', async () => {
    // Requests the root
    const { status, body } = await request(oServer.url, '/');

    // Checks that index.route.ts answered
    assert.equal(status, 200);
    assert.deepEqual(body, { success: true, message: 'root' });
  });

  test('health.route.ts is mounted on /health', async () => {
    // Requests /health
    const { status, body } = await request(oServer.url, '/health');

    // Checks that health.route.ts answered
    assert.equal(status, 200);
    assert.deepEqual(body.result, { status: 'ok' });
  });

  test('a nested route with an expression receives the params', async () => {
    // Requests the nested route with an id
    const { status, body } = await request(oServer.url, '/service/test/42');

    // Checks that the handler read the param
    assert.equal(status, 200);
    assert.deepEqual(body.result, { id: '42' });
  });

  test('the status of a handler is the HTTP status, and an error status sets success false', async () => {
    // Calls the handler that returns status 409
    const { status, body } = await request(oServer.url, '/service/test/42', { method: 'DELETE' });

    // Checks the 409
    assert.equal(status, 409);
    assert.deepEqual(body, { success: false, message: 'Cannot be deleted' });
  });

  test('QUERY reaches the handler with its body', async () => {
    // Sends a QUERY with a JSON body
    const { status, body } = await request(oServer.url, '/service/test/42', {
      method: 'QUERY',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'nano' }),
    });

    // Checks that the handler read the param and the body
    assert.equal(status, 200);
    assert.deepEqual(body.result, { id: '42', query: { name: 'nano' } });
  });

  test('an undeclared method answers 405', async () => {
    // Calls a method the route does not define
    const { status, body } = await request(oServer.url, '/health', { method: 'PUT' });

    // Checks the 405
    assert.equal(status, 405);
    assert.match(body.message, /not implemented/);
  });

  test('the JSON body reaches the handlers parsed', async () => {
    // Posts a JSON body
    const { status, body } = await request(oServer.url, '/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bruno' }),
    });

    // Checks that the handler got it parsed, with its status 201
    assert.equal(status, 201);
    assert.deepEqual(body.result, { name: 'Bruno' });
  });

  test('an invalid file is discarded without taking down the other routes', async () => {
    // Checks that the invalid route is not mounted
    const { status } = await request(oServer.url, '/broken');
    assert.equal(status, 404);

    // Checks that the valid routes still answer
    const { status: healthStatus } = await request(oServer.url, '/health');
    assert.equal(healthStatus, 200);
  });
});
