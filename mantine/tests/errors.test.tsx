// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Notifications } from '@mantine/notifications';
import { Controller, createView } from '@nano-app/frontend';
import { Errors } from '../src';
import TestApp from './provider';

// Probe that keeps a failed request in the api store and shows how many it has
const Probe = createView(Controller, probe => (
  <button
    onClick={() =>
      probe.stores.api.set('/error/list', [
        { success: false, message: 'Invalid email', timestamp: 1 },
      ])
    }
  >
    {`errors ${probe.stores.api.get('/error/list')?.length ?? 0}`}
  </button>
));

test('Errors shows a failed request of an api store and takes it from the store', async () => {
  // Renders the errors and keeps a failed request
  render(
    <TestApp>
      <Notifications />
      <Errors />
      <Probe />
    </TestApp>,
  );
  fireEvent.click(screen.getByText('errors 0'));

  // The notification shows its message, and the store has no error left
  await waitFor(() => assert.ok(screen.getByText('Invalid email')));
  assert.ok(screen.getByText('errors 0'));
});
