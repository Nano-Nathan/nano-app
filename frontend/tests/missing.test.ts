// First: api stores without their URLs, read when the proxy loads
import './env/missing';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../src/app/proxy';

describe('proxy without the URLs', () => {
  test('a request to a store without its URL answers 500 with the variable to define', async () => {
    // Asks a store without its URL
    const oRes = await proxy(new NextRequest('http://localhost:3100/api/orders/users'));

    assert.equal(oRes.status, 500);
    assert.deepEqual(await oRes.json(), {
      success: false,
      message:
        '[nano-app] [ERROR] The api store "orders" needs the environment variable API_ORDERS_URL. Define it.',
    });
  });

  test('a path of no store goes on to the app routes', async () => {
    // Asks a path no api store has
    const oRes = await proxy(new NextRequest('http://localhost:3100/api/unknown'));

    assert.equal(oRes.headers.get('x-middleware-next'), '1');
  });

  test('a request outside /api goes on to the app routes', async () => {
    // Asks a page of the app
    const oRes = await proxy(new NextRequest('http://localhost:3100/users'));

    assert.equal(oRes.headers.get('x-middleware-next'), '1');
  });
});
