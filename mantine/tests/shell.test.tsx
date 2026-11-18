// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import Shell from '../src/layout/shell/Shell';
import TestApp, { aVisited } from './provider';

const PORT = 4202;

// Requests the backend received
const aRequests: string[] = [];

// Backend of the api store: keeps each request and answers it as done
const oBackend = createServer((oReq, oRes) => {
  aRequests.push(`${oReq.method} ${oReq.url}`);
  oRes.writeHead(200, { 'content-type': 'application/json' }).end('{"success":true}');
});

// Links of the navbar
const LINKS = [
  { href: '/', label: 'home.title', icon: 'H' },
  { href: '/accounts', label: 'accounts.title', icon: 'A' },
];

before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
after(() => oBackend.close());

afterEach(() => {
  cleanup();
  aRequests.length = 0;
  aVisited.length = 0;
});

/** Renders the shell on /accounts with a page inside */
function renderShell(): void {
  render(
    <PathnameContext.Provider value="/accounts">
      <TestApp>
        <Shell
          title="finance"
          links={LINKS}
          login="/login"
          user={{ name: 'Ana Diaz', email: 'ana@nano.app' }}
        >
          <p>page</p>
        </Shell>
      </TestApp>
    </PathnameContext.Provider>,
  );
}

test('the shell shows the title, a link per option with the current one active, the page and the user', () => {
  renderShell();

  // The header, the page, and the user with its initials
  assert.ok(screen.getByText('finance'));
  assert.ok(screen.getByText('page'));
  assert.ok(screen.getByText('AD'));
  assert.ok(screen.getByText('Ana Diaz'));
  assert.ok(screen.getByText('ana@nano.app'));

  // Each link leads to its path, only the current one active
  const oHome = screen.getByRole('link', { name: 'i18n.home.title' });
  const oAccounts = screen.getByRole('link', { name: 'i18n.accounts.title' });
  assert.equal(oHome.getAttribute('href'), '/');
  assert.equal(oAccounts.getAttribute('href'), '/accounts');
  assert.equal(oHome.hasAttribute('data-active'), false);
  assert.equal(oAccounts.hasAttribute('data-active'), true);
});

test('sign out signs out at Better Auth and goes to login', async () => {
  renderShell();

  // Clicks the sign-out of the navbar
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

  // Better Auth signed out, and the router went to the login
  await waitFor(() => assert.deepEqual(aVisited, ['/login']));
  assert.deepEqual(aRequests, ['POST /api/api/auth/sign-out']);
});
