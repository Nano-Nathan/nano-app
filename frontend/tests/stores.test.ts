import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

    assert.deepEqual(oManager.oRoot, { app: {}, ui: { busy: false } });
    assert.equal(oManager.getStore('ui').get('/busy'), false);
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
