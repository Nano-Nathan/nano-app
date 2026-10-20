import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Store from '../src/stores/Store';
import StoreLoader from '../src/stores/StoreLoader';
import StoreManager from '../src/stores/StoreManager';

describe('store files', () => {
  test('a store is named after its file', () => {
    // Validates two app stores
    const oFiles = StoreLoader.validate({
      '/src/stores/app.store.ts': { type: 'app', data: { counter: 1 } },
      '/src/stores/ui.store.ts': { type: 'app' },
    });

    assert.deepEqual(Object.keys(oFiles).sort(), ['app', 'ui']);
    assert.equal(oFiles.ui.type, 'app');
  });

  test('an invalid file is skipped and the rest are kept', () => {
    // Validates one valid file and three broken ones
    const oFiles = StoreLoader.validate({
      '/src/stores/app.store.ts': { type: 'app' },
      '/src/stores/text.store.ts': 'not an object',
      '/src/stores/kind.store.ts': { type: 'other' },
      '/src/stores/api.store.ts': { type: 'api', path: '/api' },
    });

    assert.deepEqual(Object.keys(oFiles), ['app']);
  });

  test('a second file with a taken name is skipped', () => {
    // Validates two files named app
    const oFiles = StoreLoader.validate({
      '/src/stores/app.store.ts': { type: 'app', data: { iFirst: 1 } },
      '/src/other/app.store.ts': { type: 'app', data: { iSecond: 2 } },
    });

    assert.deepEqual(oFiles.app, { type: 'app', data: { iFirst: 1 } });
  });
});

describe('store state', () => {
  test('set creates the missing levels and get reads them, with or without the leading slash', () => {
    // Writes a nested value and reads it back
    const oStore = new Store('app', {});
    oStore.set('/drawer/isOpen', true);

    assert.equal(oStore.get('/drawer/isOpen'), true);
    assert.equal(oStore.get('drawer/isOpen'), true);
    assert.equal(oStore.get('/drawer/missing/deep'), undefined);
  });

  test('get reads the snapshot when there is one', () => {
    // Reads the same path from the live state and from a snapshot
    const oStore = new Store('app', { sValue: 'live' });

    assert.equal(oStore.get('/sValue'), 'live');
    assert.equal(oStore.get('/sValue', { app: { sValue: 'snapshot' } }), 'snapshot');
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
