// First: Testing Library needs the DOM when it loads
import './dom';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MISSING_PROVIDER, STORES_ENV } from '@nano-app/core/const';
import createController from '../src/creators/createController';
import { NanoAppProvider } from '../src/react/NanoAppProvider';
import type { ReactNode } from 'react';

// Stores of the app under test, as `withNanoApp` inlines them
process.env[STORES_ENV] = JSON.stringify({
  app: { type: 'app', data: { iCount: 0, sReason: '' } },
  ui: { type: 'app', data: { isOpen: false } },
});

/** Renders inside the provider, like the root layout does */
function renderApp(oNode: ReactNode): void {
  render(<NanoAppProvider>{oNode}</NanoAppProvider>);
}

/** Renders of the counter, to check which writes render it */
let iRenders = 0;

const counterController = createController(({ props, stores: { app } }) => ({
  increment: () => app.set('/iCount', app.get('/iCount') + 1),
  update: (iValue: number) => {
    app.set('/iCount', app.get('/iCount') + iValue);
    app.set('/sReason', `${props.sName} ${iValue}`);
  },
}));

const Counter = counterController.bindView(({ props, stores: { app }, increment, update }) => {
  iRenders++;
  return (
    <div>
      <output>{app.get('/iCount')}</output>
      <span>{`${props.sName}: ${app.get('/sReason')}`}</span>
      <button onClick={increment}>+</button>
      <button onClick={() => update(-5)}>-5</button>
    </div>
  );
});

afterEach(cleanup);

describe('createController', () => {
  test('a method gets its arguments, the stores and the props; the view shows the result', () => {
    // Clicks the method without arguments, then the one with an argument
    renderApp(<Counter sName="Ana" />);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('-5'));

    assert.equal(screen.getByRole('status').textContent, '-4');
    assert.ok(screen.getByText('Ana: Ana -5'));
  });

  test('two views bound to one controller share its methods and the stores', () => {
    // Binds a second view that only increments
    const Increment = counterController.bindView(({ increment }) => (
      <button onClick={increment}>inc</button>
    ));
    renderApp(
      <>
        <Counter sName="Ivo" />
        <Increment />
      </>,
    );

    // Clicks the second view: the first one shows the write
    fireEvent.click(screen.getByText('inc'));

    assert.equal(screen.getByRole('status').textContent, '1');
  });

  test('several writes in one method render once, and other paths render nothing', () => {
    // Renders the counter next to a view that writes a path the counter does not read
    const Toggle = createController(({ stores: { ui } }) => ({
      toggle: () => ui.set('/isOpen', !ui.get('/isOpen')),
    })).bindView(({ toggle }) => <button onClick={toggle}>toggle</button>);
    renderApp(
      <>
        <Counter sName="Eva" />
        <Toggle />
      </>,
    );
    iRenders = 0;

    // Writes the other path, then two paths of the counter in one method
    fireEvent.click(screen.getByText('toggle'));
    fireEvent.click(screen.getByText('-5'));

    assert.equal(iRenders, 1);
  });

  test('a view without NanoAppProvider fails with the fix', () => {
    // Renders outside the provider
    assert.throws(() => render(<Counter />), { message: MISSING_PROVIDER });
  });
});
