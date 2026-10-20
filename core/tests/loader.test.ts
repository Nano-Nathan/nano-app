import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Modules from '../loader/Modules';

describe('store files', () => {
  test('an invalid store is discarded and the rest are kept', () => {
    // Validates one valid store and four broken ones
    const oFiles = Modules.validate(
      {
        '/src/stores/app.store.ts': { type: 'app', data: { counter: 1 } },
        '/src/stores/text.store.ts': 'not an object',
        '/src/stores/kind.store.ts': { type: 'other' },
        '/src/stores/api.store.ts': { type: 'api', path: '/api' },
        '/src/stores/data.store.ts': { type: 'app', data: 'not an object' },
      },
      'store',
      '/src/stores/',
    );

    assert.deepEqual(Object.keys(oFiles), ['app']);
  });
});
