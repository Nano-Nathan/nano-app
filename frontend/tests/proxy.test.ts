// First: the stores of the proxy and their URLs, read when it loads
import './env/proxy';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import { proxy } from '../src/app/proxy';
import { follow } from './helpers';
import type { NanoObject } from '@nano-app/core/types/objects';

const PORT = 4100;

// Backend that answers with what it received, and sets a cookie
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Echoes the request with a new cookie
    const { method, url, headers } = oReq;
    oRes.setHeader('Set-Cookie', 'session=new; Path=/; HttpOnly');
    oRes.setHeader('Content-Type', 'application/json');
    oRes.end(JSON.stringify({ method, url, cookie: headers.cookie, body: sBody }));
  });
});

/** Runs the proxy on a request to the app, and sends its rewrite to the backend as Next does */
async function send(
  sPath: string,
  oInit: { method?: string; headers?: NanoObject<string>; body?: string } = {},
): Promise<Response> {
  const oRes = await proxy(new NextRequest(`http://localhost:3100${sPath}`, oInit));
  return follow(oRes, { method: oInit.method, body: oInit.body });
}

describe('proxy', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());

  test('a request reaches its backend with method, path, query, body and cookie', async () => {
    // Sends a request with a body and a cookie to a store whose URL has a base path
    const oRes = await send('/api/admin_users/users/7?top=1', {
      method: 'POST',
      headers: { cookie: 'session=old' },
      body: '{"name":"Ana"}',
    });

    // Checks what the backend received and that its cookie came back
    assert.equal(oRes.headers.get('set-cookie'), 'session=new; Path=/; HttpOnly');
    assert.deepEqual(await oRes.json(), {
      method: 'POST',
      url: '/api/users/7?top=1',
      cookie: 'session=old',
      body: '{"name":"Ana"}',
    });
  });

  test('each api store goes to its own backend URL', async () => {
    // Sends the same path to the other store
    const oRes = await send('/api/orders/users');

    assert.equal((await oRes.json()).url, '/users');
  });

  test('a request outside /api/<store> goes on to the app routes', async () => {
    // Checks that each path goes on to Next
    for (const sPath of ['/admin_users/users', '/api', '/api/unknown/users']) {
      const oRes = await send(sPath);
      assert.equal(oRes.headers.get('x-middleware-next'), '1', sPath);
    }
  });
});
