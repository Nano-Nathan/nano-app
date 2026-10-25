// First: Testing Library needs the DOM when it loads
import './dom';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NanoAppProvider } from '@nano-app/frontend';
import { REQUEST_FAILED, STORES_ENV } from '@nano-app/core/const';
import error from '../error';
import type { ApiResponse } from '@nano-app/core/types/api';

const PORT = 4201;

// Backend behind the proxy: answers every request as failed, a warning for `/warn`
const oBackend = createServer((oReq, oRes) => {
  const oAnswer = oReq.url?.endsWith('/warn')
    ? { success: false, message: 'Careful', warning: true }
    : { success: false };
  oRes.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(oAnswer));
});

// Two api stores, as `withNanoApp` inlines them
process.env[STORES_ENV] = JSON.stringify({ api: { type: 'api' }, admin: { type: 'api' } });

// The errors of every store, the last one and buttons that fail a request on each store
const Errors = error()
  .extend(({ stores: { api, admin } }) => ({
    failApi: () => api.read('/users'),
    warnAdmin: () => admin.update('/warn', {}),
  }))
  .bindView(({ items, last, dismiss, clear, failApi, warnAdmin }) => (
    <div>
      <ul>
        {items().map((oError: ApiResponse, iIndex) => (
          <li key={iIndex}>{oError.warning ? `warning ${oError.message}` : oError.message}</li>
        ))}
      </ul>
      <output>{last()?.message ?? 'none'}</output>
      <button onClick={failApi}>fail</button>
      <button onClick={warnAdmin}>warn</button>
      <button onClick={dismiss}>dismiss</button>
      <button onClick={clear}>clear</button>
    </div>
  ));

describe('error', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() =>
    render(
      <NanoAppProvider>
        <Errors />
      </NanoAppProvider>,
    ),
  );

  test('gives the errors of every api store and the last one', async () => {
    // Fails a request on each store
    fireEvent.click(screen.getByText('fail'));
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 1));
    fireEvent.click(screen.getByText('warn'));
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 2));

    assert.equal(screen.getAllByRole('listitem')[0].firstChild?.textContent, REQUEST_FAILED);
    assert.equal(screen.getAllByRole('listitem')[1].firstChild?.textContent, 'warning Careful');
    assert.equal(screen.getByRole('status').textContent, 'Careful');
  });

  test('dismiss removes the last error, and clear removes all of them', async () => {
    // Fails a request on each store
    fireEvent.click(screen.getByText('fail'));
    fireEvent.click(screen.getByText('warn'));
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 2));

    // Dismisses the last error, then clears the rest
    fireEvent.click(screen.getByText('dismiss'));
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 1));
    assert.equal(screen.getByRole('status').textContent, REQUEST_FAILED);
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() => assert.equal(screen.queryAllByRole('listitem').length, 0));

    assert.equal(screen.getByRole('status').textContent, 'none');
  });
});
