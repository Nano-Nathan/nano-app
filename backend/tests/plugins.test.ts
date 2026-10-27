import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { startApp, request, boot } from './helpers';
import Plugin from '../src/routes/Plugin';
import { createPluginCallbacks } from '../src/app/creators';

const PLUGIN_ROUTES = 'tests/fixtures/plugin-routes';
const CALLBACK_ROUTES = 'tests/fixtures/callback-routes';

describe('plugins', () => {
  test('mounts the routes discovered in its routesDir', async () => {
    // Starts an app with the plugin
    const oServer = await startApp([{ routesDir: PLUGIN_ROUTES }]);

    // Requests its route
    const { status, body } = await request(oServer.url, '/ping');

    // Checks that it answered
    assert.equal(status, 200);
    assert.equal(body.message, 'pong');

    // Stops the server
    await oServer.close();
  });

  test('prepends the base path to every endpoint', async () => {
    // Starts an app with the plugin under /demo
    const oServer = await startApp([{ routesDir: PLUGIN_ROUTES, basePath: '/demo' }]);

    // Checks that its route answers only under the base path
    assert.equal((await request(oServer.url, '/demo/ping')).status, 200);
    assert.equal((await request(oServer.url, '/ping')).status, 404);

    // Stops the server
    await oServer.close();
  });

  test('a plugin with no routesDir mounts nothing', async () => {
    // Starts an app with a plugin without routes
    const oServer = await startApp([{ basePath: '/empty' }]);

    // Checks that its base path has nothing
    assert.equal((await request(oServer.url, '/empty')).status, 404);

    // Stops the server
    await oServer.close();
  });

  test('several plugins coexist on the same application', async () => {
    // Starts an app with the same plugin on two base paths
    const oServer = await startApp([
      { routesDir: PLUGIN_ROUTES, basePath: '/first' },
      { routesDir: PLUGIN_ROUTES, basePath: '/second' },
    ]);

    // Checks that both answer
    assert.equal((await request(oServer.url, '/first/ping')).status, 200);
    assert.equal((await request(oServer.url, '/second/ping')).status, 200);

    // Stops the server
    await oServer.close();
  });

  test('discovers built .js route files and ignores their .d.ts', async () => {
    // Starts an app with the built routes
    const oServer = await startApp([{ routesDir: 'tests/fixtures/built-routes' }]);

    // Checks that the built route answers
    const { status, body } = await request(oServer.url, '/hello');
    assert.equal(status, 200);
    assert.equal(body.message, 'hello');

    // Stops the server
    await oServer.close();
  });

  test('plugin onMount runs once with the app before its endpoints; endpoint onInit once, onBefore per request', async () => {
    // Starts a plugin whose callbacks record their calls and whose onMount adds a header
    const aCalls: string[] = [];
    const oServer = await startApp([
      {
        routesDir: CALLBACK_ROUTES,
        options: { calls: aCalls, greeting: 'hi' },
        callbacks: createPluginCallbacks({
          onMount: async (oApp, oParams) => {
            oParams.calls.push('mount');
            oApp.use((_oReq, oRes, fnNext) => {
              oRes.set('x-mounted', 'yes');
              fnNext();
            });
          },
        }),
      },
    ]);

    try {
      // Checks that onMount ran before onInit, once each
      assert.deepEqual(aCalls, ['mount', 'init']);

      // Checks that the handler got the options and the onBefore result
      const { status, body, headers } = await request(oServer.url, '/hook');
      assert.equal(status, 200);
      assert.deepEqual(body.result, { greeting: 'hi', before: 'hello' });
      assert.equal(headers.get('x-mounted'), 'yes');

      // The plugin's middleware precedes every endpoint, whatever their order
      assert.equal((await request(oServer.url, '/plain')).headers.get('x-mounted'), 'yes');

      // Checks that onBefore can reject, and that it runs once per request
      const oDenied = await request(oServer.url, '/hook?deny=1');
      assert.equal(oDenied.status, 403);
      assert.deepEqual(aCalls, ['mount', 'init', 'before GET', 'before GET']);
    } finally {
      await oServer.close();
    }
  });

  test('NanoApp mounts the plugins of each stage around the consumer routes, in order', async () => {
    // Boots a real NanoApp with a plugin after and one before the consumer routes
    const oApp = await boot({
      plugins: [
        { routesDir: PLUGIN_ROUTES, basePath: '/late', stage: 'after' },
        { routesDir: PLUGIN_ROUTES, basePath: '/early' },
      ],
    });

    try {
      // Reads the mount order from the startup log
      const aMounted = [...oApp.output().matchAll(/\[INFO\] (\/\S*)/g)].map(([, sPath]) => sPath);

      // Checks the order: before, consumer routes, after
      assert.equal(aMounted[0], '/early/ping', oApp.output());
      assert.equal(aMounted.at(-1), '/late/ping');
      assert.ok(aMounted.includes('/health'));
      assert.equal((await request(oApp.url, '/late/ping')).status, 200);
    } finally {
      oApp.child.kill('SIGKILL');
    }
  });

  test("a plugin's database needs its schema", async () => {
    // A plugin whose schema does not exist
    const oPlugin = new Plugin({
      name: 'missing',
      routesDir: '',
      database: { enabled: true, schemaPath: 'tests/fixtures/missing.prisma' },
    });

    // Checks that mounting it fails saying which
    await assert.rejects(oPlugin.mount(express()), /tests\/fixtures\/missing.prisma not found/);
  });
});
