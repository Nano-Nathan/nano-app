// First: api stores without their URLs, read when the proxy loads
import './env/missing';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../src/app/proxy';

describe('proxy without the URLs', () => {
  test('every /api request answers 500 with the variables to define', async () => {
    // Asks a store, and a path of no store
    for (const sPath of ['/api/orders/users', '/api/unknown']) {
      const oRes = await proxy(new NextRequest(`http://localhost:3100${sPath}`));

      assert.equal(oRes.status, 500, sPath);
      assert.deepEqual(await oRes.json(), {
        success: false,
        message:
          '[nano-app] [ERROR] The api stores need the environment variables API_ADMIN_USERS_URL, API_ORDERS_URL. Define them.',
      });
    }
  });

  test('a request outside /api goes on to the app routes', async () => {
    // Asks a page of the app
    const oRes = await proxy(new NextRequest('http://localhost:3100/users'));

    assert.equal(oRes.headers.get('x-middleware-next'), '1');
  });
});
