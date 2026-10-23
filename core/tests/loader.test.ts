import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import FileLoader from '../loader/FileLoader';
import Validator from '../loader/Validator';

const sStoresDir = fileURLToPath(new URL('./fixtures/stores', import.meta.url));

describe('store files', () => {
  test('stores are found in subfolders, named with _ for / and the invalid ones dropped', async () => {
    const oFiles = await FileLoader.findMany({ extension: 'store', sourceDir: sStoresDir });

    assert.deepEqual(Object.keys(oFiles).sort(), ['admin_users', 'app']);
    assert.deepEqual(oFiles.admin_users, { type: 'app', data: { aUsers: [] } });
  });

  test('a store must be an app or api store with object data', () => {
    const oFiles = Validator.validate(
      {
        none: 'not an object',
        kind: { type: 'other' },
        api: { type: 'api' },
        data: { type: 'app', data: 'not an object' },
        app: { type: 'app', data: { iCount: 0 } },
      },
      'store',
    );

    assert.deepEqual(Object.keys(oFiles), ['api', 'app']);
  });
});
