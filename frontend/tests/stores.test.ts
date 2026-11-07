// First: the stores of the app, read when the frontend loads
import './env/stores';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { reaction } from 'mobx';
import { STORES_ENV } from '@nano-app/core/const';
import { withNanoApp } from '../src/next';
import Store from '../src/stores/Store';
import createStores from '../src/creators/createStores';

describe('store state', () => {
  test('set creates missing levels and get reads them, with or without the leading slash', () => {
    // Writes a nested value and reads it back
    const oStore = new Store({});
    oStore.set('/drawer/isOpen', true);

    assert.equal(oStore.get('/drawer/isOpen'), true);
    assert.equal(oStore.get('drawer/isOpen'), true);
    assert.equal(oStore.get('/drawer/missing/deep'), undefined);
  });

  test('createStores starts each store with its data, plus an empty app store', () => {
    // Creates the stores, as one React tree does
    const { app, ui } = createStores();

    assert.deepEqual(app.get('/'), {});
    assert.equal(ui.get('/busy'), false);
  });

  test('an api store has its own state from its data, read and written by path', () => {
    // Creates the stores and writes the api store
    const { backend } = createStores();
    backend.set('/list/orderby', { name: 'asc' });

    assert.equal(backend.get('/page'), 1);
    assert.deepEqual(backend.get('/list/orderby'), { name: 'asc' });
  });

  test('a write notifies only who read that path', () => {
    // Watches one path of the store
    const oStore = new Store({ user: { name: 'Ana', email: 'ana@nano.app' } });
    const aSeen: string[] = [];
    const fnStop = reaction(
      () => oStore.get('/user').name,
      sName => aSeen.push(sName),
    );

    // Writes another path, then the watched one
    oStore.set('/user/email', 'ana@other.app');
    oStore.set('/user/name', 'Eva');
    fnStop();

    assert.deepEqual(aSeen, ['Eva']);
  });
});

describe('withNanoApp', () => {
  test('the app stores reach the bundle as JSON and the Next config is kept', async () => {
    // Runs from an app with src/stores/app.store.ts, like Next does
    const sCwd = process.cwd();
    process.chdir(fileURLToPath(new URL('./fixtures/app', import.meta.url)));

    try {
      const oConfig = await withNanoApp({ reactStrictMode: true, env: { API: '/api' } })();

      assert.equal(oConfig.reactStrictMode, true);
      assert.equal(oConfig.env?.API, '/api');
      assert.deepEqual(JSON.parse(oConfig.env?.[STORES_ENV] ?? ''), {
        app: { type: 'app', data: { iCount: 0 } },
      });
    } finally {
      process.chdir(sCwd);
    }
  });

  test('every page gets the security headers, and the app can replace them', async () => {
    // Runs from an app with its own X-Frame-Options on /embed
    const sCwd = process.cwd();
    process.chdir(fileURLToPath(new URL('./fixtures/app', import.meta.url)));

    try {
      const oConfig = await withNanoApp({
        headers: async () => [
          { source: '/embed', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
        ],
      })();

      // Checks that X-Powered-By is hidden and the security headers come before the app's own
      const aHeaders = (await oConfig.headers?.()) ?? [];
      assert.equal(oConfig.poweredByHeader, false);
      assert.deepEqual(
        aHeaders.map(oEntry => oEntry.source),
        ['/:path*', '/embed'],
      );
      assert.deepEqual(
        aHeaders[0].headers.map(oHeader => oHeader.key),
        ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy'],
      );
    } finally {
      process.chdir(sCwd);
    }
  });
});
