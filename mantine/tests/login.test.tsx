// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import createLoginPage from '../pages/login';
import TestApp, { aVisited } from './provider';

const PORT = 4202;

// Requests the backend received
const aRequests: string[] = [];

// Backend of the api store: keeps each request and answers it as done
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);
    oRes.writeHead(200, { 'content-type': 'application/json' }).end('{"success":true}');
  });
});

// Login page of the api store, titled finance, that goes to /home
const LoginPage = createLoginPage({
  store: 'api',
  home: '/home',
  providers: ['google'],
  texts: { title: 'finance' },
});

before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
after(() => oBackend.close());

afterEach(() => {
  cleanup();
  aRequests.length = 0;
  aVisited.length = 0;
});

/** Renders the login page and types an email and a password */
function renderLogin(): void {
  render(
    <TestApp>
      <LoginPage />
    </TestApp>,
  );
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@nano.app' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
}

test('the login page shows its texts: the given title, English for the rest', () => {
  renderLogin();

  // The title given, and the English buttons
  assert.ok(screen.getByText('finance'));
  assert.ok(screen.getByText('Sign in'));
  assert.ok(screen.getByText('Create account'));
});

test('the login page signs in at the store with the values and goes to home', async () => {
  renderLogin();

  // Submits the form
  fireEvent.submit(screen.getByText('Sign in'));

  // Better Auth's sign-in got the values, and the router went home
  await waitFor(() => assert.deepEqual(aVisited, ['/home']));
  assert.deepEqual(aRequests, [
    'POST /api/api/auth/sign-in/email {"email":"ana@nano.app","password":"secret"}',
  ]);
});

test('the login page signs up with the same values, the email as the name, and goes to home', async () => {
  renderLogin();

  // Creates the account
  fireEvent.click(screen.getByText('Create account'));

  // Better Auth's sign-up got the values with the name, and the router went home
  await waitFor(() => assert.deepEqual(aVisited, ['/home']));
  assert.deepEqual(aRequests, [
    'POST /api/api/auth/sign-up/email {"email":"ana@nano.app","password":"secret","name":"ana@nano.app"}',
  ]);
});

test('the login page asks Better Auth the page of Google, back to home', async () => {
  renderLogin();

  // Clicks the button of Google
  fireEvent.click(screen.getByText('Continue with Google'));

  // Better Auth's social sign-in got the provider and the home
  await waitFor(() =>
    assert.deepEqual(aRequests, [
      'POST /api/api/auth/sign-in/social {"provider":"google","callbackURL":"/home"}',
    ]),
  );
});
