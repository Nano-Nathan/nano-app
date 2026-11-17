// First: Testing Library needs the DOM when it loads
import './dom';
import './env/auth';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider, createView } from '@nano-app/frontend';
import AuthController from '../auth';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const PORT = 4201;

// Requests the backend received, and the urls the router went to
const aRequests: string[] = [];
const aVisited: string[] = [];

// Backend behind the proxy: keeps each request and answers it as done
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Keeps the request, with its store
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);
    oRes.writeHead(200, { 'content-type': 'application/json' }).end('{"success":true}');
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

/** View of an auth: its buttons */
function view(auth: AuthController): ReactNode {
  return (
    <div>
      <button onClick={() => auth.signIn({ email: 'ana@nano.app', password: 'secret' })}>
        sign in
      </button>
      <button onClick={() => auth.signUp({ email: 'ana@nano.app', password: 'secret' })}>
        sign up
      </button>
      <button onClick={auth.signOut}>sign out</button>
      <button onClick={() => auth.navTo('/private')}>go</button>
    </div>
  );
}

/** Renders a view inside the provider and the router of the app */
function renderApp(oNode: ReactNode): void {
  render(
    <AppRouterContext.Provider value={oRouter}>
      <NanoAppProvider>{oNode}</NanoAppProvider>
    </AppRouterContext.Provider>,
  );
}

describe('auth', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests nor visits
    aRequests.length = 0;
    aVisited.length = 0;
  });

  test('signIn sends the body to Better Auth with the kind of the subclass', async () => {
    // Renders an auth of the username method and signs in
    class UsernameController extends AuthController {
      public kind = 'username';
    }
    const Auth = createView(UsernameController, view);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign in'));

    await waitFor(() =>
      assert.deepEqual(aRequests, [
        'POST /api/api/auth/sign-in/username {"email":"ana@nano.app","password":"secret"}',
      ]),
    );
  });

  test('signUp signs up with email by default, and signOut signs out', async () => {
    // Renders an auth, signs up and signs out
    const Auth = createView(AuthController, view);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign up'));
    fireEvent.click(screen.getByText('sign out'));

    await waitFor(() => assert.equal(aRequests.length, 2));
    assert.ok(aRequests.some(sRequest => sRequest.startsWith('POST /api/api/auth/sign-up/email ')));
    assert.ok(aRequests.includes('POST /api/api/auth/sign-out {}'));
  });

  test('a subclass reads the api store named in store', async () => {
    // Renders an auth of the admin store and signs out
    class AdminController extends AuthController {
      public store = 'admin';
    }
    const Auth = createView(AdminController, view);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('sign out'));

    await waitFor(() => assert.deepEqual(aRequests, ['POST /api/admin/auth/sign-out {}']));
  });

  test('navTo goes to the url with the router of the app', () => {
    // Renders an auth and goes to the private page
    const Auth = createView(AuthController, view);
    renderApp(<Auth />);
    fireEvent.click(screen.getByText('go'));

    assert.deepEqual(aVisited, ['/private']);
  });
});
