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
    oRes.end(JSON.stringify({ method, url, cookie: headers.cookie, body: sBody }));
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

    // Sets the backend URL of the store
    process.env.API_ADMIN_USERS_URL = `http://localhost:${PORT}/api`;
  });

  after(() => oBackend.close());

  test('a request to an api store reaches its backend with method, path, query, body and cookie', async () => {
    const oRes = await send('/api/admin_users/users/7?top=1', {
      method: 'POST',
      headers: { cookie: 'session=old' },
      body: '{"name":"Ana"}',
    });

    assert.equal(oRes.headers.get('set-cookie'), 'session=new; Path=/; HttpOnly');
    assert.deepEqual(await oRes.json(), {
      method: 'POST',
      url: '/api/users/7?top=1',
      cookie: 'session=old',
      body: '{"name":"Ana"}',
    });
  });

  test('a request outside /api/<store> goes on to the app routes', async () => {
    for (const sPath of ['/admin_users/users', '/api']) {
      const oRes = await send(sPath);
      assert.equal(oRes.headers.get('x-middleware-next'), '1', sPath);
    }
  });

  test('an api store without its env var answers 500 with the variable to define', async () => {
    // Removes the backend URL
    delete process.env.API_ADMIN_USERS_URL;
    const oRes = await send('/api/admin_users/users');

    assert.equal(oRes.status, 500);
    assert.deepEqual(await oRes.json(), {
      success: false,
      message:
        '[nano-app] [ERROR] The store "admin_users" has no backend URL. Define the API_ADMIN_USERS_URL environment variable.',
    });
  });
});
