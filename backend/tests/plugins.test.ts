import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request, boot } from './helpers';
import Plugin from '../src/plugins/Plugin';
import { createPlugin, createPluginCallbacks, createRoute } from '../src/lib/creators';
import * as reserved from './fixtures/database/reserved';

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

  test('mounts the routes made in code beside its routesDir; a path in both takes the code', async () => {
    // Starts an app with a plugin that has both
    const oServer = await startApp([
      {
        routesDir: PLUGIN_ROUTES,
        routes: {
          '/ping': createRoute({ GET: async () => ({ message: 'code' }) }),
          '/extra': createRoute({ GET: async () => ({ result: true }) }),
        },
      },
    ]);

    // Checks that the code wins on /ping and its own route answers
    assert.equal((await request(oServer.url, '/ping')).body.message, 'code');
    assert.equal((await request(oServer.url, '/extra')).status, 200);

    // Stops the server
    await oServer.close();
  });

  test('a route made in code that breaks the schema fails, naming its path', async () => {
    // A plugin with a route whose public is not a boolean
    const oPlugin = new Plugin({
      name: 'bad',
      routes: { '/bad': { public: 'yes', GET: async () => ({}) } as any },
    });

    // Checks that building it fails naming the path
    await assert.rejects(oPlugin.build(), /\/bad:\n.*expected boolean/);
  });

  test("the consumer's basePath goes over the plugin's default", async () => {
    // A plugin with its default base path, mounted as is and moved
    const fnDemo = createPlugin(() => ({
      name: 'demo',
      basePath: '/demo',
      routesDir: PLUGIN_ROUTES,
    }));
    const oServer = await startApp([fnDemo(), fnDemo({ basePath: '/moved' })]);

    // Checks that it answers on both
    assert.equal((await request(oServer.url, '/demo/ping')).status, 200);
    assert.equal((await request(oServer.url, '/moved/ping')).status, 200);

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

  test('plugin onMount runs once before its endpoints; endpoint onInit once, onBefore per request', async () => {
    // Starts a plugin whose callbacks record their calls
    const aCalls: string[] = [];
    const oServer = await startApp([
      {
        routesDir: CALLBACK_ROUTES,
        options: { calls: aCalls, greeting: 'hi' },
        callbacks: createPluginCallbacks({
          onMount: async oParams => {
            oParams.calls.push('mount');
          },
        }),
      },
    ]);

    try {
      // Checks that onMount ran before onInit, once each
      assert.deepEqual(aCalls, ['mount', 'init']);

      // Checks that the handler got the options and the onBefore result
      const { status, body } = await request(oServer.url, '/hook');
      assert.equal(status, 200);
      assert.deepEqual(body.result, { greeting: 'hi', before: 'hello' });

      // Checks that onBefore can reject, and that it runs once per request
      const oDenied = await request(oServer.url, '/hook?deny=1');
      assert.equal(oDenied.status, 403);
      assert.deepEqual(aCalls, ['mount', 'init', 'before GET', 'before GET']);
    } finally {
      await oServer.close();
    }
  });

  test('NanoApp mounts the plugins before and after the consumer routes, in order', async () => {
    // Boots a real NanoApp with a plugin after and one before the consumer routes
    const oApp = await boot({
      plugins: {
        after: [{ name: 'late', routesDir: PLUGIN_ROUTES, basePath: '/late' }],
        before: [{ name: 'early', routesDir: PLUGIN_ROUTES, basePath: '/early' }],
      },
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

  test('a plugin keeps no tables in the nano_* schema of another', async () => {
    // A plugin named "other" with a table in nano_test
    const oPlugin = new Plugin({
      name: 'other',
      routesDir: '',
      database: { relations: reserved.relations },
    });

    // Checks that building it fails naming the table and the rule
    await assert.rejects(
      oPlugin.build(),
      /"nano_test.items" breaks the rule, each nano_\* schema is reserved/,
    );
  });
});
