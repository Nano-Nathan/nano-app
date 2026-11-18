// First: Testing Library needs the DOM when it loads
import './dom';
import './env/form';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import NotificationController from '../notification';
import TestApp from './provider';

// View that notifies a success, removes the first one and lists the kept ones
const Probe = createView(NotificationController, notify => (
  <div>
    <button onClick={() => notify.notify({ type: 'success', message: 'Saved' })}>add</button>
    <button onClick={() => notify.remove(notify.items()[0].id)}>remove</button>
    <button onClick={notify.clear}>clear</button>
    <output>
      {notify
        .items()
        .map(oItem => `${oItem.type}:${oItem.message}`)
        .join(',')}
    </output>
  </div>
));

afterEach(cleanup);

test('notify keeps each notification at /notification/list, from the oldest', () => {
  render(
    <TestApp>
      <Probe />
    </TestApp>,
  );

  // Notifies twice, removes the first one, then empties them
  fireEvent.click(screen.getByText('add'));
  fireEvent.click(screen.getByText('add'));
  assert.equal(screen.getByRole('status').textContent, 'success:Saved,success:Saved');
  fireEvent.click(screen.getByText('remove'));
  assert.equal(screen.getByRole('status').textContent, 'success:Saved');
  fireEvent.click(screen.getByText('clear'));
  assert.equal(screen.getByRole('status').textContent, '');
});
