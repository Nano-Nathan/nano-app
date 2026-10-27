// First: the stores of the proxy, read when it loads
import './env/proxy';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';

const PORT = 4100;

// Backend that answers with what it received, and sets a cookie
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    const { method, url, headers } = oReq;
    oRes.setHeader('Set-Cookie', 'session=new; Path=/; HttpOnly');
    oRes.setHeader('Content-Type', 'application/json');
    oRes.end(
      JSON.stringify({
        method,
        url,
        cookie: headers.cookie,
        key: headers['x-api-key'],
        body: sBody,
      }),
    );
  });
});

/** Runs the proxy on a request to the app */
function send(
  sPath: string,
  oInit?: ConstructorParameters<typeof NextRequest>[1],
): Promise<Response> {
  return proxy(new NextRequest(`http://localhost:3100${sPath}`, oInit));
}

describe('proxy', () => {
  before(async () => {
    // Starts the backend
    await new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve));

    // Sets their env; orders has no key
    process.env.API_ADMIN_USERS_URL = `http://localhost:${PORT}/api`;
    process.env.API_USERS_KEY_HEADER = 'secret';
    process.env.API_ORDERS_URL = `http://localhost:${PORT}`;
  });

  after(() => oBackend.close());

  test('a request reaches its backend with method, path, query, body, cookie and the store key', async () => {
    // Sends a request with a body and a cookie to a store with a key
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
      key: 'secret',
      body: '{"name":"Ana"}',
    });
  });

  test('the browser cannot replace a header of the store', async () => {
    // Sends the store's header from the browser
    const oRes = await send('/api/admin_users/users', { headers: { 'x-api-key': 'fake' } });

    // Checks that the backend got the store's value
    assert.equal((await oRes.json()).key, 'secret');
  });

  test('a request outside /api/<store> goes on to the app routes', async () => {
    // Checks that each path goes on to Next
    for (const sPath of ['/admin_users/users', '/api']) {
      const oRes = await send(sPath);
      assert.equal(oRes.headers.get('x-middleware-next'), '1', sPath);
    }
  });

  test('a missing URL or header answers 500 with the variable to define', async () => {
    // A store without its URL, and one without the env var of its header
    for (const [sName, sEnvName] of [
      ['missing', 'API_MISSING_URL'],
      ['orders', 'API_ORDERS_KEY_HEADER'],
    ]) {
      const oRes = await send(`/api/${sName}/users`);

      assert.equal(oRes.status, 500);
      assert.deepEqual(await oRes.json(), {
        success: false,
        message: `[nano-app] [ERROR] The store "${sName}" needs the ${sEnvName} environment variable. Define it.`,
      });
    }
  });
});
