import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import FileLoader from '../files/FileLoader';
import Validator from '../utils/Validator';

const STORES_DIR = fileURLToPath(new URL('./fixtures/stores', import.meta.url));

describe('store files', () => {
  test('stores are found in subfolders, named with _ for / and the invalid ones dropped', async () => {
    // Finds the store files of the fixtures
    const oFound = await FileLoader.findMany({ extension: 'store', sourceDir: STORES_DIR });
    const oFiles = Validator.validate(oFound, Validator.isStore);

    // Checks their names and that the invalid one was dropped
    assert.deepEqual(Object.keys(oFiles).sort(), ['admin_users', 'app']);
    assert.deepEqual(oFiles.admin_users, { type: 'app', data: { aUsers: [] } });
  });

  test('a store must be an app or api store with object data, string headers and auth', () => {
    // Validates one entry per rule
    const oFiles = Validator.validate(
      {
        none: 'not an object',
        kind: { type: 'other' },
        api: { type: 'api', headers: { 'x-api-key': 'STRIPE_KEY' } },
        headers: { type: 'api', headers: { 'x-api-key': 1 } },
        auth: { type: 'api', auth: '/api/auth' },
        session: { type: 'api', auth: { path: '/api/auth' } },
        data: { type: 'app', data: 'not an object' },
        app: { type: 'app', data: { iCount: 0 } },
      },
      Validator.isStore,
    );

    // Checks that only the valid ones stay
    assert.deepEqual(Object.keys(oFiles), ['api', 'session', 'app']);
  });

  test('auth.routes need a match and a redirect with /, string roles and string actions, and no loop', () => {
    // Validates one store per rule of its routes
    const fnAuth = (aRoutes: unknown): unknown => ({
      type: 'api',
      auth: { path: '/a', routes: aRoutes },
    });
    const oFiles = Validator.validate(
      {
        list: fnAuth('/admin'),
        route: fnAuth(['/admin']),
        match: fnAuth([{ match: 'admin' }]),
        redirect: fnAuth([{ match: '/admin', redirect: 'login' }]),
        loop: fnAuth([{ match: '/*' }]),
        roles: fnAuth([{ match: '/admin', roles: ['admin'] }]),
        permissions: fnAuth([{ match: '/admin', permissions: { collections: ['read'] } }]),
        valid: fnAuth([
          { match: '/', redirect: '/login' },
          { match: '/admin/*', roles: 'admin,editor', permissions: { collections: 'read,update' } },
        ]),
      },
      Validator.isStore,
    );

    // Checks that only the valid one stays
    assert.deepEqual(Object.keys(oFiles), ['valid']);
  });
});
