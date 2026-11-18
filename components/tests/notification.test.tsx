// First: Testing Library needs the DOM when it loads
import './dom';
import './env/auth';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import NotificationController from '../notification';
import TestApp from './provider';

/** History with a method that keeps a failed request in the api store */
class ProbeController extends NotificationController {
  /** Keeps a failed request, as the api store does */
  public fail(): void {
    this.stores.api.set('/error/list', [{ success: false, message: 'Refused', timestamp: 1 }]);
  }
}

// View of the history: its buttons, and each notification with its flags
const Probe = createView(ProbeController, history => (
  <div>
    <button onClick={() => history.notify({ type: 'success', message: 'Saved' })}>add</button>
    <button onClick={() => history.markShown(history.items()[0].id)}>show</button>
    <button onClick={history.fail}>fail</button>
    <button onClick={history.collect}>collect</button>
    <button onClick={() => history.remove(history.items()[0].id)}>remove</button>
    <button onClick={history.clear}>clear</button>
    <output>
      {history
        .items()
        .map(oItem => `${oItem.type}:${oItem.message}:${oItem.shown}`)
        .join(',')}
    </output>
    <p>{`fresh ${history.fresh().length} errors ${history.errors().length}`}</p>
  </div>
));

afterEach(cleanup);

/** Renders the history and clicks its buttons in order */
function run(...aButtons: string[]): string {
  render(
    <TestApp>
      <Probe />
    </TestApp>,
  );
  for (const sButton of aButtons) fireEvent.click(screen.getByText(sButton));
  return screen.getByRole('status').textContent ?? '';
}

test('notify adds to the history a notification not shown yet', () => {
  assert.equal(run('add'), 'success:Saved:false');
  assert.ok(screen.getByText('fresh 1 errors 0'));
});

test('markShown marks a notification, which stays in the history', () => {
  assert.equal(run('add', 'show'), 'success:Saved:true');
  assert.ok(screen.getByText('fresh 0 errors 0'));
});

test('collect moves the failed requests of the stores to the history as errors', () => {
  assert.equal(run('fail', 'collect'), 'error:Refused:false');
  assert.ok(screen.getByText('fresh 1 errors 0'));
});

test('remove takes one notification out, and clear empties the history', () => {
  assert.equal(run('add', 'add', 'remove'), 'success:Saved:false');
  fireEvent.click(screen.getByText('clear'));
  assert.equal(screen.getByRole('status').textContent, '');
});
