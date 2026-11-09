// First: the stores of the proxy, read when it loads
import './env/proxy';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';
import type { NanoObject } from '@nano-app/core/types/objects';

const PORT = 4100;

// Users of the backend's Better Auth, by the cookie of their session
const USERS: NanoObject = { user: { role: 'user' }, admin: { role: 'user,admin' } };

/** Answers like Better Auth: the session of the cookie, and the permissions only of an admin */
function answerAuth(sUrl: string, sCookie: string, sBody: string, sOrigin?: string): unknown {
  // Reads the user of the cookie
  const oUser = USERS[sCookie.replace('session=', '')];

  // Answers the session, or null without one
  if (sUrl === '/auth/get-session') return oUser ? { session: {}, user: oUser } : null;

  // Answers the permissions of an admin, sent from the app's origin
  const isAdmin = oUser?.role.includes('admin') && sOrigin === 'http://localhost:3100';
  const isAsked = sBody === JSON.stringify({ permissions: { collections: ['read', 'update'] } });
  return { error: null, success: Boolean(isAdmin && isAsked) };
}

// Backend that answers with what it received, and sets a cookie; Better Auth at `/auth`
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    const { method, url = '', headers } = oReq;

    // Answers as Better Auth
    if (url.startsWith('/auth/')) {
      const oAnswer = answerAuth(url, headers.cookie ?? '', sBody, headers.origin);
      oRes.setHeader('Content-Type', 'application/json');
      return oRes.end(JSON.stringify(oAnswer));
    }

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
    process.env.API_GUARDED_URL = `http://localhost:${PORT}`;
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

  test('a page outside auth.routes is public', async () => {
    // Asks a page without a route, and one that only starts like a guarded one
    for (const sPath of ['/', '/dashboard/x', '/administration']) {
      const oRes = await send(sPath);
      assert.equal(oRes.headers.get('x-middleware-next'), '1', sPath);
    }
  });

  test('a route without roles nor permissions needs a session, and goes to its redirect', async () => {
    // Asks the page without a session and with one
    const oOut = await send('/dashboard');
    const oIn = await send('/dashboard', { headers: { cookie: 'session=user' } });

    assert.equal(oOut.status, 307);
    assert.equal(oOut.headers.get('location'), 'http://localhost:3100/login');
    assert.equal(oIn.headers.get('x-middleware-next'), '1');
  });

  test('a route with roles needs any of them, and goes to / by default', async () => {
    // Asks the page and one below it, as a user and as an admin
    const oUser = await send('/admin/users', { headers: { cookie: 'session=user' } });
    const oAdmin = await send('/admin', { headers: { cookie: 'session=admin' } });

    assert.equal(oUser.headers.get('location'), 'http://localhost:3100/');
    assert.equal(oAdmin.headers.get('x-middleware-next'), '1');
  });

  test('a route with permissions asks Better Auth for every one of them', async () => {
    // Asks the page without a session, as a user and as an admin
    const oOut = await send('/reports');
    const oUser = await send('/reports', { headers: { cookie: 'session=user' } });
    const oAdmin = await send('/reports', { headers: { cookie: 'session=admin' } });

    assert.equal(oOut.headers.get('location'), 'http://localhost:3100/');
    assert.equal(oUser.headers.get('location'), 'http://localhost:3100/');
    assert.equal(oAdmin.headers.get('x-middleware-next'), '1');
  });
});
