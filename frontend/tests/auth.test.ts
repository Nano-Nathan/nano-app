// First: the stores need the DOM when they load
import './dom';
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { STORES_ENV } from '@nano-app/core/const';
import createStores from '../src/creators/createStores';
import AuthStore from '../src/stores/AuthStore';
import type { NanoObject } from '@nano-app/core/types/objects';

const PORT = 4201;

// Requests the backend received, by method and path
const aRequests: string[] = [];

// Whether the backend has a session
let isSignedIn = false;

/** Answers like a backend with Better Auth at `/api/auth`, and `/users` behind its session */
function answer(sMethod: string, sUrl: string, sBody: string): [number, unknown] {
  const sPath = sUrl.replace('/api/backend', '');
  const oBody = sBody ? JSON.parse(sBody) : {};
  const oUser = { email: 'ana@nano.app' };

  // Signs in with the right password
  if (sPath === '/api/auth/sign-in/email') {
    isSignedIn = oBody.password === 'secret';
    if (!isSignedIn)
      return [401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }];
    return [200, { token: 'token', user: oUser }];
  }

  // Signs out
  if (sPath === '/api/auth/sign-out') {
    isSignedIn = false;
    return [200, { success: true }];
  }

  // Answers the session, or null without one
  if (sPath === '/api/auth/get-session' && isSignedIn)
    return [200, { session: { id: 'session' }, user: oUser }];
  if (sPath === '/api/auth/get-session') return [200, null];

  // Answers the app's routes only with a session
  if (!isSignedIn) return [401, { success: false, message: 'Not authenticated' }];

  return [200, { success: true, result: [oUser] }];
}

// Backend behind the proxy: the test serves `/api/backend/...` on the DOM's origin
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    const { method = '', url = '' } = oReq;
    aRequests.push(`${method} ${url}`);
    const [iStatus, oAnswer] = answer(method, url, sBody);
    oRes.writeHead(iStatus, { 'content-type': 'application/json' }).end(JSON.stringify(oAnswer));
  });
});

/** Requests received for one method and path */
function count(sRequest: string): number {
  return aRequests.filter(sEntry => sEntry === sRequest).length;
}

describe('auth store', () => {
  before(async () => {
    // Moves the DOM to this backend's origin: the api store tests use the default one
    Reflect.get(globalThis, 'happyDOM').setURL(`http://localhost:${PORT}`);
    await new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve));
  });
  after(() => oBackend.close());
  beforeEach(() => {
    // Starts each test without a session nor requests
    aRequests.length = 0;
    isSignedIn = false;
  });

  test('an api store with auth reads the session, and one without it does not', () => {
    // Creates an api store with auth and one without, as `withNanoApp` inlines them
    process.env[STORES_ENV] = JSON.stringify({
      backend: { type: 'api', auth: '/api/auth' },
      payments: { type: 'api' },
    });
    const { backend, payments } = createStores();

    assert.equal(typeof backend.readSession, 'function');
    assert.equal(payments.readSession, undefined);
  });

  test('signIn wraps the answer of Better Auth and reads the session', async () => {
    // Signs in
    const oStore = new AuthStore('backend', '/api/auth');
    const oResponse: NanoObject = await oStore.signIn('email', {
      email: 'ana@nano.app',
      password: 'secret',
    });

    assert.deepEqual(oResponse, {
      success: true,
      result: { token: 'token', user: { email: 'ana@nano.app' } },
      message: undefined,
    });
    assert.deepEqual(oStore.get('/session').user, { email: 'ana@nano.app' });
  });

  test('a failed signIn returns the message of Better Auth and keeps no session', async () => {
    // Signs in with a wrong password, and reads the session
    const oStore = new AuthStore('backend', '/api/auth');
    const oResponse = await oStore.signIn('email', { email: 'ana@nano.app', password: 'wrong' });
    await oStore.readSession();

    assert.equal(oResponse.success, false);
    assert.equal(oResponse.message, 'Invalid email or password');
    assert.equal(oStore.get('/session'), null);
  });

  test('readSession answers from the store until the next sign-in or sign-out', async () => {
    // Reads the session twice, signs in, then reads it again
    const oStore = new AuthStore('backend', '/api/auth');
    await oStore.readSession();
    await oStore.readSession();
    await oStore.signIn('email', { email: 'ana@nano.app', password: 'secret' });
    await oStore.readSession();

    assert.equal(count('GET /api/backend/api/auth/get-session'), 2);

    // Signs out: the session is read again, without a user
    await oStore.signOut();
    await oStore.readSession();

    assert.equal(count('GET /api/backend/api/auth/get-session'), 3);
    assert.equal(oStore.get('/session'), null);
  });

  test('a 401 clears the session, and the routes of the app answer as they come', async () => {
    // Signs in and reads a route behind the session
    const oStore = new AuthStore('backend', '/api/auth');
    await oStore.signIn('email', { email: 'ana@nano.app', password: 'secret' });

    assert.deepEqual(await oStore.read('/users'), {
      success: true,
      result: [{ email: 'ana@nano.app' }],
    });

    // The session ends in the backend, and a write answers 401
    isSignedIn = false;
    const oResponse = await oStore.create('/users', {});
    await oStore.readSession();

    assert.deepEqual(oResponse, { success: false, message: 'Not authenticated' });
    assert.equal(oStore.get('/session'), null);
    assert.equal(count('GET /api/backend/api/auth/get-session'), 2);
  });
});
