import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '@nano-app/core';
import { STORE } from '../src/utils/validations';

describe('store files', () => {
  test('a store must be an app or api store with object data, string headers and auth', () => {
    // Checks that each invalid store throws naming its file
    const oInvalid = {
      none: 'not an object',
      kind: { type: 'other' },
      headers: { type: 'api', headers: { 'x-api-key': 1 } },
      auth: { type: 'api', auth: '/auth' },
      data: { type: 'app', data: 'not an object' },
    };
    for (const [sName, oStore] of Object.entries(oInvalid)) {
      assert.throws(
        () => Validator.validate(STORE, oStore, sName),
        new RegExp(`${sName}:\n`),
        sName,
      );
    }

    // Checks that the valid ones pass
    const oValid = {
      api: { type: 'api', headers: { 'x-api-key': 'STRIPE_KEY' } },
      session: { type: 'api', auth: { path: '/auth' } },
      app: { type: 'app', data: { iCount: 0 } },
    };
    for (const [sName, oStore] of Object.entries(oValid)) {
      assert.deepEqual(Validator.validate(STORE, oStore, sName), oStore);
    }
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
      assert.throws(
        () => Validator.validate(STORE, fnAuth(aRoutes), 'auth'),
        /auth:\n.*\n.*routes/,
      );
    }

    // Checks that valid routes pass
    const oValid = fnAuth([
      { match: '/', redirect: '/login' },
      { match: '/admin/*', roles: 'admin,editor', permissions: { collections: 'read,update' } },
    ]);
    assert.deepEqual(Validator.validate(STORE, oValid, 'valid'), oValid);
  });
});
