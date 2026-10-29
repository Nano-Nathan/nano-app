// First: Testing Library needs the DOM when it loads
import './dom';
import './env/auth';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider } from '@nano-app/frontend';
import auth from '../auth';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { View } from '@nano-app/frontend';
import type { AuthMethods } from '../types/auth';

const PORT = 4201;

// Requests the backend received, the urls the router went to, and whether there is a session
const aRequests: string[] = [];
const aVisited: string[] = [];
let isSignedIn = false;

// Backend behind the proxy: answers Better Auth's sign-in, sign-up, sign-out and get-session
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Keeps the request, with its store
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);

    // Signs in or up and out, and answers the session when there is one
    if (oReq.url?.includes('/sign-in/') || oReq.url?.includes('/sign-up/')) isSignedIn = true;
    if (oReq.url?.endsWith('/sign-out')) isSignedIn = false;
    const oSession = { user: { email: 'ana@nano.app' }, session: { id: 's1' } };
    const sAnswer = JSON.stringify(isSignedIn ? oSession : null);
    oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
  });
});

// Router of the app, keeping the urls it goes to
const oRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: sHref => aVisited.push(sHref),
  replace: () => {},
  prefetch: () => {},
  bfcacheId: '',
};

/** View of an auth: the email of the session and its buttons */
const fnView: View<AuthMethods> = ({ stores, signIn, signUp, signOut, load, navTo }) => (
  <div>
    <output>{stores.api?.get('/session')?.user.email ?? 'none'}</output>
    <button onClick={() => signIn({ email: 'ana@nano.app', password: 'secret' })}>sign in</button>
    <button onClick={() => signUp({ email: 'ana@nano.app', password: 'secret' })}>sign up</button>
    <button onClick={signOut}>sign out</button>
    <button onClick={load}>load</button>
    <button onClick={() => navTo('/private')}>go</button>
  </div>
);

/** Renders a view inside the provider and the router of the app */
function renderApp(oNode: ReactNode): void {
  render(
    <AppRouterContext.Provider value={oRouter}>
      <NanoAppProvider>{oNode}</NanoAppProvider>
    </AppRouterContext.Provider>,
  );
}

/** Waits until the view shows this email of the session */
async function expectEmail(sEmail: string): Promise<void> {
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, sEmail));
}

describe('auth', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests, visits nor session
    aRequests.length = 0;
    aVisited.length = 0;
    isSignedIn = false;
  });

  test('signIn sends the body to the kind of the options and reads the session', async () => {
    // Renders an auth of the username method and signs in
    const Auth = auth({ kind: 'username' }).bindView(fnView);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign in'));
    await expectEmail('ana@nano.app');

    assert.equal(
      aRequests[0],
      'POST /api/api/api/auth/sign-in/username {"email":"ana@nano.app","password":"secret"}',
    );
    assert.equal(aRequests[1], 'GET /api/api/api/auth/get-session ');
  });

  test('signUp signs up with email by default, and signOut clears the session', async () => {
    // Renders an auth and signs up
    const Auth = auth().bindView(fnView);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign up'));
    await expectEmail('ana@nano.app');

    // Signs out
    fireEvent.click(screen.getByText('sign out'));
    await expectEmail('none');

    assert.match(aRequests[0], /^POST \/api\/api\/api\/auth\/sign-up\/email /);
    assert.equal(aRequests[2], 'POST /api/api/api/auth/sign-out {}');
  });

  test('load reads the session of the api store named in store', async () => {
    // Renders an auth of another api store and reads its session
    const Auth = auth({ store: 'admin' }).bindView(fnView);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => assert.equal(aRequests.length, 1));

    assert.equal(aRequests[0], 'GET /api/admin/auth/get-session ');
  });

  test('navTo goes to the url with the router of the app', () => {
    // Renders an auth and goes to the private page
    const Auth = auth().bindView(fnView);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('go'));

    assert.deepEqual(aVisited, ['/private']);
  });

  test('without its api store it asks nothing', async () => {
    // Renders an auth of a store the app does not have and signs in
    const Auth = auth({ store: 'missing' }).bindView(fnView);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign in'));
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 50)));

    assert.equal(aRequests.length, 0);
  });
});
