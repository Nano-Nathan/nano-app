// First: Testing Library needs the DOM when it loads
import './dom';
import './env/message';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { REQUEST_FAILED } from '@nano-app/core/const';
import { createView } from '@nano-app/frontend';
import MessageController from '../message';
import TestApp from './provider';
import type { ApiMessage } from '@nano-app/frontend';

const PORT = 4201;

// Backend behind the proxy: answers every request as failed, a warning for `/warn`
const oBackend = createServer((oReq, oRes) => {
  const oAnswer = oReq.url?.endsWith('/warn')
    ? { success: false, message: 'Careful', type: 'warning' }
    : { success: false };
  oRes.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(oAnswer));
});

/** The errors with two methods that fail a request on each store */
class MessagesController extends MessageController {
  public failApi(): Promise<unknown> {
    // Reads a path that fails
    return this.stores.api.GET('/users');
  }

  public warnAdmin(): Promise<unknown> {
    // Writes a path that answers a warning
    return this.stores.admin.PUT('/warn', {});
  }
}

// The errors of every store, the last one and buttons that fail a request on each store
const Errors = createView(MessagesController, errors => (
  <div>
    <ul>
      {errors.items().map((oError: ApiMessage, iIndex) => (
        <li key={iIndex}>
          {`${oError.type} ${oError.message}`}
          <button onClick={() => errors.remove(iIndex)}>remove</button>
        </li>
      ))}
    </ul>
    <output>{errors.last()?.message ?? 'none'}</output>
    <button onClick={errors.failApi}>fail</button>
    <button onClick={errors.warnAdmin}>warn</button>
    <button onClick={errors.dismiss}>dismiss</button>
    <button onClick={errors.clear}>clear</button>
  </div>
));

/** Fails a request on `api`, then a later one on `admin` */
async function failBoth(): Promise<void> {
  // Fails the first request and waits for its error
  fireEvent.click(screen.getByText('fail'));
  await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 1));

  // Waits so the next error is newer, then fails the second request
  await new Promise(fnResolve => setTimeout(fnResolve, 5));
  fireEvent.click(screen.getByText('warn'));
  await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 2));
}

describe('message', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() =>
    render(
      <TestApp>
        <Errors />
      </TestApp>,
    ),
  );

  test('gives the errors of every api store from the newest, and the newest one', async () => {
    // Fails a request on each store
    await failBoth();

    assert.equal(screen.getAllByRole('listitem')[0].firstChild?.textContent, 'warning Careful');
    assert.equal(
      screen.getAllByRole('listitem')[1].firstChild?.textContent,
      `error ${REQUEST_FAILED}`,
    );
    assert.equal(screen.getByRole('status').textContent, 'Careful');
  });

  test('dismiss removes the newest error, and clear removes all of them', async () => {
    // Fails a request on each store
    await failBoth();

    // Dismisses the newest error, then clears the rest
    fireEvent.click(screen.getByText('dismiss'));
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 1));
    assert.equal(screen.getByRole('status').textContent, REQUEST_FAILED);
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() => assert.equal(screen.queryAllByRole('listitem').length, 0));

    assert.equal(screen.getByRole('status').textContent, 'none');
  });

  test('remove removes the error at its index', async () => {
    // Fails a request on each store
    await failBoth();

    // Removes the first error
    fireEvent.click(screen.getAllByText('remove')[0]);
    await waitFor(() => assert.equal(screen.getAllByRole('listitem').length, 1));

    assert.equal(
      screen.getAllByRole('listitem')[0].firstChild?.textContent,
      `error ${REQUEST_FAILED}`,
    );
  });
});
