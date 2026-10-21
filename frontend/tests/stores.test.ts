import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { reaction } from 'mobx';
import { withNanoApp } from '../src/next';
import { STORES_ENV } from '@nano-app/core/const';
import Store from '../src/stores/Store';
import StoreManager from '../src/stores/StoreManager';

describe('store state', () => {
  test('set creates the missing levels and get reads them, with or without the leading slash', () => {
    // Writes a nested value and reads it back
    const oStore = new Store({});
    oStore.set('/drawer/isOpen', true);

    assert.equal(oStore.get('/drawer/isOpen'), true);
    assert.equal(oStore.get('drawer/isOpen'), true);
    assert.equal(oStore.get('/drawer/missing/deep'), undefined);
  });

  test('the manager starts each store with its data, and adds an empty app store', () => {
    // Creates the stores of one app file
    const oManager = new StoreManager({
      ui: { type: 'app', data: { busy: false } },
    });

    assert.deepEqual(oManager.getStore('app').get('/'), {});
    assert.equal(oManager.getStore('ui').get('/busy'), false);
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

  test('a write outside set is reported, a write with set is not', () => {
    // Watches a path and records the warnings
    const oStore = new Store({ user: { name: 'Ana' } });
    const fnStop = reaction(
      () => oStore.get('/user').name,
      () => {},
    );
    const oWarn = mock.method(console, 'warn', () => {});

    try {
      // Writes with set, then directly on the value that get returned
      oStore.set('/user/name', 'Eva');
      oStore.get('/user').name = 'Ivo';

      assert.equal(oWarn.mock.callCount(), 1);
      assert.match(String(oWarn.mock.calls[0]?.arguments[0]), /without using an action/);
    } finally {
      oWarn.mock.restore();
      fnStop();
    }
  });

  test('an unknown store fails with the file to create', () => {
    // Asks for a store that does not exist
    const oManager = new StoreManager({});

    assert.throws(() => oManager.getStore('users'), /Create src\/stores\/users\.store\.ts/);
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

  test('the provider reads the env var that withNanoApp writes', () => {
    // Reads the provider's source: Next only inlines `process.env.<name>` written literally
    const sProvider = readFileSync(
      fileURLToPath(new URL('../src/react/NanoAppProvider.tsx', import.meta.url)),
      'utf8',
    );

    assert.ok(sProvider.includes(`process.env.${STORES_ENV}`));
  });
});
