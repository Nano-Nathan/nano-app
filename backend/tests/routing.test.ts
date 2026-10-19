import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request, mountedPaths } from './helpers';

describe('file path to express path', () => {
  // [routesDir, basePath, expected Express path]
  const aCases: [string, string | undefined, string][] = [
    ['tests/fixtures/paths/index', undefined, '/'],
    ['tests/fixtures/paths/index-expression', undefined, '/:entity'],
    ['tests/fixtures/paths/plain', undefined, '/service/test/:id'],
    ['tests/fixtures/paths/index', '/demo', '/demo'],
    ['tests/fixtures/paths/plain', '/demo', '/demo/service/test/:id'],
  ];

  // One test per case
  for (const [sRoutesDir, sBasePath, sExpected] of aCases) {
    test(`${sRoutesDir.split('/').pop()} + base ${sBasePath ?? '-'} → ${sExpected}`, async () => {
      assert.deepEqual(await mountedPaths({ routesDir: sRoutesDir, basePath: sBasePath }), [
        sExpected,
      ]);
    });
  }

  test('index-expression + base /demo → /demo/:entity', async () => {
    assert.deepEqual(
      await mountedPaths({ routesDir: 'tests/fixtures/paths/index-expression', basePath: '/demo' }),
      ['/demo/:entity'],
    );
  });
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

  test('success:false answers 400', async () => {
    // Calls the handler that returns success: false
    const { status, body } = await request(oServer.url, '/service/test/42', { method: 'DELETE' });

    // Checks the 400
    assert.equal(status, 400);
    assert.equal(body.success, false);
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
      body: JSON.stringify({ hola: 'mundo' }),
    });

    // Checks that the handler got it parsed
    assert.equal(status, 200);
    assert.deepEqual(body.result, { hola: 'mundo' });
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
