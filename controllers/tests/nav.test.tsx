// First: Testing Library needs the DOM when it loads
import './dom';
import './env/nav';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { createView } from '@nano-app/frontend';
import { NavController } from '../src';
import TestApp from './provider';

/** Navigation with two links, the open flag and a button per method */
const Nav = createView(NavController, nav => (
  <nav>
    <output>{`${nav.isActive('/accounts')} ${nav.isActive('/settings')} ${nav.isToggled()}`}</output>
    <button onClick={nav.toggle}>toggle</button>
    <button onClick={nav.close}>close</button>
  </nav>
));

describe('nav', () => {
  afterEach(cleanup);

  test('isActive is on for the link of the current page; toggle opens and close closes', () => {
    // Renders the navigation on /accounts
    render(
      <PathnameContext.Provider value="/accounts">
        <TestApp>
          <Nav />
        </TestApp>
      </PathnameContext.Provider>,
    );
    assert.equal(screen.getByRole('status').textContent, 'true false false');

    // Opens the menu, then closes it
    fireEvent.click(screen.getByText('toggle'));
    assert.equal(screen.getByRole('status').textContent, 'true false true');
    fireEvent.click(screen.getByText('close'));
    assert.equal(screen.getByRole('status').textContent, 'true false false');
  });
});
