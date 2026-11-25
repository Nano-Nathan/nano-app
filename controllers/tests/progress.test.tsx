// First: Testing Library needs the DOM when it loads
import './dom';
import './env/progress';
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import { ProgressController } from '../src';
import TestApp from './provider';

const PORT = 4201;

// Backend behind the proxy: answers each request after a while, so it stays out
const oBackend = createServer((_oReq, oRes) => {
  setTimeout(
    () => oRes.writeHead(200, { 'content-type': 'application/json' }).end('{"success":true}'),
    100,
  );
});

before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
after(() => oBackend.close());
afterEach(cleanup);

test('isActive is on while a request of any api store is out, and sync starts and completes a progress', async () => {
  // Renders whether it is active, a button that requests the admin store, and the calls of sync
  const aCalls: string[] = [];
  const oProgress = { start: () => aCalls.push('start'), complete: () => aCalls.push('complete') };
  const Progress = createView(ProgressController, progress => {
    progress.sync(oProgress);
    return (
      <>
        <button onClick={() => progress.stores.admin.GET('/users')}>request</button>
        <span>{`active ${progress.isActive()}`}</span>
      </>
    );
  });
  render(
    <TestApp>
      <Progress />
    </TestApp>,
  );

  // Idle, then active while the admin store waits, then idle once it answers
  assert.ok(screen.getByText('active false'));
  screen.getByText('request').click();
  await waitFor(() => assert.ok(screen.getByText('active true')));
  await waitFor(() => assert.ok(screen.getByText('active false')));
  assert.deepEqual([...new Set(aCalls)], ['complete', 'start']);
});

test('a click on a link of the app to another path keeps it active until the page arrives', async () => {
  // Renders links to another path, to the same one and outside, a button that arrives, and whether it is active
  const Progress = createView(ProgressController, progress => (
    <>
      <a href="/other">other</a>
      <a href={progress.pathname}>same</a>
      <a href="https://example.com/away">away</a>
      <button onClick={progress.arrive}>arrive</button>
      <span>{`active ${progress.isActive()}`}</span>
    </>
  ));
  render(
    <TestApp>
      <Progress />
    </TestApp>,
  );

  // The same path and another site keep it idle; another path of the app makes it active until it arrives
  screen.getByText('same').addEventListener('click', oEvent => oEvent.preventDefault());
  screen.getByText('away').addEventListener('click', oEvent => oEvent.preventDefault());
  screen
    .getByText('other')
    .addEventListener('click', oEvent => oEvent.preventDefault(), { once: true });
  screen.getByText('same').click();
  screen.getByText('away').click();
  assert.ok(screen.getByText('active false'));
  screen.getByText('other').click();
  await waitFor(() => assert.ok(screen.getByText('active true')));
  screen.getByText('arrive').click();
  await waitFor(() => assert.ok(screen.getByText('active false')));
});
