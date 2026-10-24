// No DOM: the stores are read as Next renders the components on the server
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STORES_ENV } from '@nano-app/core/const';
import createStores from '../src/creators/createStores';

// Store of the backend, as `withNanoApp` inlines it
process.env[STORES_ENV] = JSON.stringify({ backend: { type: 'api' } });

describe('api store on the server', () => {
  test('read asks nothing and returns undefined', async () => {
    // Reads the backend outside a browser, and lets a request start if one would
    const { backend } = createStores();
    const oResult = backend.read('/users');
    await new Promise(fnResolve => setTimeout(fnResolve, 10));

    assert.equal(oResult, undefined);
    assert.equal(backend.busy, 0);
  });
});
