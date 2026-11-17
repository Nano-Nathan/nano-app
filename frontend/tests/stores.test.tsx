// First: the DOM for the provider, then the stores of the app, read when the frontend loads
import './dom';
import './env/stores';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { reaction } from 'mobx';
import { STORES_DEFINE } from '@nano-app/core/const';
import { withNanoApp } from '../src/app/next';
import Store from '../src/stores/Store';
import { renderStores } from './provider';

describe('store state', () => {
  test('set creates missing levels and get reads them, with or without the leading slash', () => {
    // Writes a nested value and reads it back
    const oStore = new Store({});
    oStore.set('/drawer/isOpen', true);

    assert.equal(oStore.get('/drawer/isOpen'), true);
    assert.equal(oStore.get('drawer/isOpen'), true);
    assert.equal(oStore.get('/drawer/missing/deep'), undefined);
  });

  test('the provider starts each store with its data, plus an empty app store', () => {
    // Creates the stores of one React tree
    const { app, ui } = renderStores();

    assert.deepEqual(app.get('/'), {});
    assert.equal(ui.get('/busy'), false);
  });

  test('an api store has its own state from its data, read and written by path', () => {
    // Creates the stores and writes the api store
    const { backend } = renderStores();
    backend.set('/list/orderby', { name: 'asc' });

    assert.equal(backend.get('/page'), 1);
    assert.deepEqual(backend.get('/list/orderby'), { name: 'asc' });
  });

  test('each React tree gets its own stores', () => {
    // Writes the stores of one tree, then reads another
    renderStores().app.set('/sName', 'Ana');

    assert.equal(renderStores().app.get('/sName'), undefined);
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
  test('the app stores reach the bundle as JSON, named with _ for /, and the Next config is kept', async () => {
    // Runs from an app with src/stores/app.store.ts and admin/users.store.ts, like Next does
    const sCwd = process.cwd();
    process.chdir(fileURLToPath(new URL('./fixtures/app', import.meta.url)));

    try {
      const oConfig = await withNanoApp({ reactStrictMode: true, env: { API: '/api' } })();

      assert.equal(oConfig.reactStrictMode, true);
      assert.equal(oConfig.env?.API, '/api');
      assert.deepEqual(JSON.parse(String(oConfig.compiler?.define?.[STORES_DEFINE])), [
        ['admin_users', { type: 'app', data: { aUsers: [] } }],
        ['app', { type: 'app', data: { iCount: 0 } }],
      ]);

      // Writes the type of each store for the app
      const sTypes = await readFile('nano-app-env.d.ts', 'utf8');
      assert.match(sTypes, /"admin_users": import\('@nano-app\/frontend'\)\.Store;/);
      assert.doesNotMatch(sTypes, /"app"/);
    } finally {
      await rm('nano-app-env.d.ts', { force: true });
      process.chdir(sCwd);
    }
  });
});
