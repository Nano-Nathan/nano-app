// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Controller, createView } from '@nano-app/frontend';
import { notify, Toasts } from '../src';
import TestApp from './provider';

// Probe that keeps a failed request in the api store and shows how many it has
const Probe = createView(Controller, probe => (
  <button
    onClick={() =>
      probe.stores.api.set('/message/list', [
        { success: false, message: 'Invalid email', timestamp: 1 },
      ])
    }
  >
    {`errors ${probe.stores.api.get('/message/list')?.length ?? 0}`}
  </button>
));

afterEach(cleanup);

test('a failed request shows as a toast and leaves its store', async () => {
  // Renders the toasts and fails a request
  render(
    <TestApp>
      <Toasts />
      <Probe />
    </TestApp>,
  );
  fireEvent.click(screen.getByText('errors 0'));

  // The toast shows its message, and the store keeps no error
  await waitFor(() => assert.ok(screen.getByText('Invalid email')));
  assert.ok(screen.getByText('errors 0'));
});

test('notify shows a notification of its kind now', async () => {
  render(
    <TestApp>
      <Toasts />
      <button onClick={() => notify({ type: 'success', message: 'Saved' })}>save</button>
    </TestApp>,
  );
  fireEvent.click(screen.getByText('save'));
  await waitFor(() => assert.ok(screen.getByText('Saved')));
});
