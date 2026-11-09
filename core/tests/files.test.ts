import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import FileLoader from '../files/FileLoader';
import Validator from '../utils/Validator';

const STORES_DIR = fileURLToPath(new URL('./fixtures/stores', import.meta.url));

describe('store files', () => {
  test('stores are found in subfolders, named with _ for /', async () => {
    // Finds the store files of the fixtures
    const oFiles = await FileLoader.findMany('store', STORES_DIR);

    // Checks their names and contents
    assert.deepEqual(Object.keys(oFiles).sort(), ['admin_users', 'app']);
    assert.deepEqual(oFiles.admin_users, { type: 'app', data: { aUsers: [] } });
  });

  test('a store must be an app or api store with object data, string headers and auth', () => {
    // Checks that each invalid store throws naming its file
    const oInvalid = {
      none: 'not an object',
      kind: { type: 'other' },
      headers: { type: 'api', headers: { 'x-api-key': 1 } },
      auth: { type: 'api', auth: '/api/auth' },
      data: { type: 'app', data: 'not an object' },
    };
    for (const [sName, oStore] of Object.entries(oInvalid)) {
      assert.throws(() => Validator.isStore(oStore, sName), new RegExp(`${sName}: `), sName);
    }

    // Checks that the valid ones pass
    const oValid = {
      api: { type: 'api', headers: { 'x-api-key': 'STRIPE_KEY' } },
      session: { type: 'api', auth: { path: '/api/auth' } },
      app: { type: 'app', data: { iCount: 0 } },
    };
    assert.deepEqual(Validator.validate(oValid, Validator.isStore), oValid);
  });

  test('auth.routes need a match and a redirect with /, string roles and string actions, and no loop', () => {
    // Checks that each invalid list of routes throws
    const fnAuth = (aRoutes: unknown): unknown => ({
      type: 'api',
      auth: { path: '/a', routes: aRoutes },
    });
    const aInvalid = [
      '/admin',
      ['/admin'],
      [{ match: 'admin' }],
      [{ match: '/admin', redirect: 'login' }],
      [{ match: '/*' }],
      [{ match: '/admin', roles: ['admin'] }],
      [{ match: '/admin', permissions: { collections: ['read'] } }],
    ];
    for (const aRoutes of aInvalid) {
      assert.throws(() => Validator.isStore(fnAuth(aRoutes), 'auth'), /"auth" must be/);
    }

    // Checks that valid routes pass
    const oValid = fnAuth([
      { match: '/', redirect: '/login' },
      { match: '/admin/*', roles: 'admin,editor', permissions: { collections: 'read,update' } },
    ]);
    assert.equal(Validator.isStore(oValid, 'valid'), true);
  });
});
