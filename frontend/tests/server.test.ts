// No DOM: the stores are read as Next renders the components on the server
import './env/server';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ApiStore from '../src/stores/ApiStore';

describe('api store on the server', () => {
  test('a request asks nothing and returns an empty ApiResponse', async () => {
    // Reads the backend outside a browser
    const oBackend = new ApiStore('backend');
    const oResult = await oBackend.GET('/users');

    assert.deepEqual(oResult, {});
    assert.equal(oBackend.get('/busy'), undefined);
  });
});
