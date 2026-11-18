// First: Testing Library needs the DOM when it loads
import './dom';
import './env/auth';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import NotificationController from '../notification';
import TestApp from './provider';

/** Notifications with a method that keeps a failed request in the api store */
class ProbeController extends NotificationController {
  /** Keeps a failed request, as the api store does */
  public fail(): void {
    this.stores.api.set('/error/list', [{ success: false, message: 'Refused', timestamp: 1 }]);
  }
}

// View of the notifications: its buttons, each notification and the errors left
const Probe = createView(ProbeController, notify => (
  <div>
    <button onClick={() => notify.notify({ type: 'success', message: 'Saved' })}>add</button>
    <button onClick={notify.fail}>fail</button>
    <button onClick={notify.collect}>collect</button>
    <button onClick={notify.clear}>clear</button>
    <output>
      {notify
        .items()
        .map(oItem => `${oItem.type}:${oItem.message}`)
        .join(',')}
    </output>
    <p>{`errors ${notify.errors().length}`}</p>
  </div>
));

afterEach(cleanup);

/** Renders the notifications and clicks its buttons in order */
function run(...aButtons: string[]): string {
  render(
    <TestApp>
      <Probe />
    </TestApp>,
  );
  for (const sButton of aButtons) fireEvent.click(screen.getByText(sButton));
  return screen.getByRole('status').textContent ?? '';
}

test('notify keeps each notification after the ones before', () => {
  assert.equal(run('add', 'add'), 'success:Saved,success:Saved');
});

test('collect moves the failed requests of the stores to the notifications as errors', () => {
  assert.equal(run('fail', 'collect'), 'error:Refused');
  assert.ok(screen.getByText('errors 0'));
});

test('clear empties the notifications', () => {
  assert.equal(run('add', 'clear'), '');
});
