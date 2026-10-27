import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import FileLoader from '../loader/FileLoader';
import Validator from '../loader/Validator';

const STORES_DIR = fileURLToPath(new URL('./fixtures/stores', import.meta.url));

describe('store files', () => {
  test('stores are found in subfolders, named with _ for / and the invalid ones dropped', async () => {
    // Finds the store files of the fixtures
    const oFiles = await FileLoader.findMany({ extension: 'store', sourceDir: STORES_DIR });

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
        auth: { type: 'api', auth: true },
        session: { type: 'api', auth: '/api/auth' },
        data: { type: 'app', data: 'not an object' },
        app: { type: 'app', data: { iCount: 0 } },
      },
      'store',
    );

    // Checks that only the valid ones stay
    assert.deepEqual(Object.keys(oFiles), ['api', 'session', 'app']);
  });
});
