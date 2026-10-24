import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
    // Creates the stores of one app file, as `withNanoApp` inlines them
    process.env[STORES_ENV] = JSON.stringify({ ui: { type: 'app', data: { busy: false } } });
    const { app, ui } = createStores();

    assert.deepEqual(app.get('/'), {});
    assert.equal(ui.get('/busy'), false);
  });

  test('an api store has its own state from its data, read and written by path', () => {
    // Creates an api store with initial data and writes it
    process.env[STORES_ENV] = JSON.stringify({ backend: { type: 'api', data: { page: 1 } } });
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

  test('createStores reads the env var that withNanoApp writes', () => {
    // Reads the source: Next only inlines `process.env.<name>` written literally
    const sSource = readFileSync(
      fileURLToPath(new URL('../src/creators/createStores.ts', import.meta.url)),
      'utf8',
    );

    assert.ok(sSource.includes(`process.env.${STORES_ENV}`));
  });
});
