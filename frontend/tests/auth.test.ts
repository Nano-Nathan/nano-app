// First: the stores need the DOM when they load
import './dom';
import './env/auth';
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { waitFor } from '@testing-library/react';
import createStores from '../src/creators/createStores';
import AuthStore from '../src/stores/AuthStore';
import { count } from './helpers';

const PORT = 4201;

// Requests the backend received, by method and path
const aRequests: string[] = [];

// Whether the backend has a session
let isSignedIn = false;

// Request that reads the session
const SESSION = 'GET /api/backend/api/auth/get-session';

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

/** An auth store of the backend and its Better Auth client, once it read the session */
async function createStore(): Promise<{
  oStore: AuthStore;
  oAuth: NonNullable<AuthStore['auth']>;
}> {
  // Creates the store: the browser has its client
  const oStore = new AuthStore('backend', '/api/auth');
  assert.ok(oStore.auth);

  // Waits for the session it reads when it is created
  await waitFor(() => assert.equal(count(aRequests, SESSION), 1));
  return { oStore, oAuth: oStore.auth };
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

  test('an api store with auth has the client of Better Auth, and one without it does not', async () => {
    // Creates the stores: an api store with auth and one without
    const { backend, payments } = createStores();

    assert.equal(typeof backend.auth.signIn.email, 'function');
    assert.equal(payments.auth, undefined);

    // Waits for the session the store with auth reads
    await waitFor(() => assert.equal(count(aRequests, SESSION), 1));
  });

  test('the store reads the session when it is created, and again after a sign-in', async () => {
    // Creates the store without a session, and signs in
    const { oStore, oAuth } = await createStore();
    assert.equal(oStore.get('/session'), null);
    const { data, error } = await oAuth.signIn.email({ email: 'ana@nano.app', password: 'secret' });

    // Checks the answer of Better Auth and the session kept
    assert.equal(error, null);
    assert.deepEqual(data?.user, { email: 'ana@nano.app' });
    await waitFor(() => assert.deepEqual(oStore.get('/session')?.user, { email: 'ana@nano.app' }));
  });

  test('a failed sign-in returns the error of Better Auth, keeps it in the store and no session', async () => {
    // Signs in with a wrong password
    const { oStore, oAuth } = await createStore();
    const { error } = await oAuth.signIn.email({ email: 'ana@nano.app', password: 'wrong' });

    assert.equal(error?.message, 'Invalid email or password');
    assert.equal(oStore.get('/error/list')[0].message, 'Invalid email or password');
    assert.equal(oStore.get('/session'), null);
    assert.equal(oStore.get('/busy'), false);
  });

  test('a sign-out clears the session', async () => {
    // Signs in, waits for the session and signs out
    const { oStore, oAuth } = await createStore();
    await oAuth.signIn.email({ email: 'ana@nano.app', password: 'secret' });
    await waitFor(() => assert.ok(oStore.get('/session')));
    await oAuth.signOut();

    await waitFor(() => assert.equal(oStore.get('/session'), null));
  });

  test('a 401 reads the session again, and the routes of the app answer as they come', async () => {
    // Signs in and reads a route behind the session
    const { oStore, oAuth } = await createStore();
    await oAuth.signIn.email({ email: 'ana@nano.app', password: 'secret' });
    await waitFor(() => assert.ok(oStore.get('/session')));

    assert.deepEqual(await oStore.read('/users'), {
      success: true,
      result: [{ email: 'ana@nano.app' }],
    });

    // The session ends in the backend, and a write answers 401
    isSignedIn = false;
    const oResponse = await oStore.create('/users', {});

    assert.deepEqual(oResponse, { success: false, message: 'Not authenticated' });
    await waitFor(() => assert.equal(oStore.get('/session'), null));
  });
});
