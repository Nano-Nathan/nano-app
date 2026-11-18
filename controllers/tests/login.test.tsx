// First: Testing Library needs the DOM when it loads
import './dom';
import './env/auth';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider, createView } from '@nano-app/frontend';
import { LoginController } from '../src';
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

/** Login of the `api` store that goes to `/home` */
class ApiLoginController extends LoginController {
  protected api = this.stores.api;
  protected home = '/home';
}

// View of the login: its mode and buttons
const Login = createView(ApiLoginController, login => (
  <div>
    <output>{login.isSignUp() ? 'sign up' : 'sign in'}</output>
    <button onClick={login.toggle}>toggle</button>
    <button onClick={() => login.send({ email: 'ana@nano.app', password: 'secret' })}>send</button>
  </div>
));

/** Renders the login inside the provider and the router of the app */
function renderLogin(): void {
  render(
    <AppRouterContext.Provider value={oRouter}>
      <NanoAppProvider>
        <Login />
      </NanoAppProvider>
    </AppRouterContext.Provider>,
  );
}

describe('login', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests nor visits
    aRequests.length = 0;
    aVisited.length = 0;
  });

  test('send signs in by default and goes home', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('send'));

    // Better Auth's sign-in got the values, and the router went home
    await waitFor(() => assert.deepEqual(aVisited, ['/home']));
    assert.deepEqual(aRequests, [
      'POST /api/api/auth/sign-in/email {"email":"ana@nano.app","password":"secret"}',
    ]);
  });

  test('toggle switches to sign up, which sends the email as the name', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('toggle'));
    assert.equal(screen.getByRole('status').textContent, 'sign up');
    fireEvent.click(screen.getByText('send'));

    // Better Auth's sign-up got the values with the name, and the router went home
    await waitFor(() => assert.deepEqual(aVisited, ['/home']));
    assert.deepEqual(aRequests, [
      'POST /api/api/auth/sign-up/email {"email":"ana@nano.app","password":"secret","name":"ana@nano.app"}',
    ]);
  });
});
