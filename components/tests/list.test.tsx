// First: Testing Library needs the DOM when it loads
import './dom';
import './env/list';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NanoAppProvider } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import list from '../list';
import type { View } from '@nano-app/frontend';
import type { ListMethods } from '../types/list';

const PORT = 4201;

// Users of the backend, and the requests it received
const USERS = ['Ana', 'Beto', 'Ciro', 'Dora', 'Eva'].map((sName, iId) => ({
  id: iId,
  name: sName,
}));
const aRequests: string[] = [];

/** A user of the backend */
type User = (typeof USERS)[number];

// Backend behind the proxy: answers `QUERY /api/<store>/users` with the page and order asked
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Keeps the request, with its store
    const { skip = 0, top, orderby = {} } = JSON.parse(sBody || '{}');
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);

    // Orders by name when asked, and slices the page
    const iSign = orderby.name === 'desc' ? -1 : 1;
    const aSorted = [...USERS].sort((oA, oB) => iSign * oA.name.localeCompare(oB.name));
    const sAnswer = JSON.stringify({ success: true, result: aSorted.slice(skip, skip + top) });
    oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
  });
});

/** View of a list: its names, its page read from the store and its buttons */
const fnView: View<ListMethods> = ({ stores, load, items, next, prev, sort }) => (
  <div>
    <output>{(items()?.result ?? []).map((oUser: User) => oUser.name).join(',')}</output>
    <button onClick={load}>load</button>
    <span>{`page ${stores[API_STORE_TYPE]?.get('/list/page') ?? 0}`}</span>
    <button onClick={next}>next</button>
    <button onClick={prev}>prev</button>
    <button onClick={() => sort('name')}>sort</button>
  </div>
);

/** Waits until the list shows these names */
async function expectNames(sNames: string): Promise<void> {
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, sNames));
}

describe('list', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests
    aRequests.length = 0;
  });

  test('reads the first page of the path, and next and prev move between pages', async () => {
    // Renders a list of two per page
    const List = list({ path: '/users', top: 2 }).bindView(fnView);
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    fireEvent.click(screen.getByText('load'));
    await expectNames('Ana,Beto');

    // Goes to the next page, then back twice: the first page is the last one back
    fireEvent.click(screen.getByText('next'));
    await expectNames('Ciro,Dora');
    fireEvent.click(screen.getByText('prev'));
    fireEvent.click(screen.getByText('prev'));
    await expectNames('Ana,Beto');

    assert.ok(screen.getByText('page 0'));
    assert.equal(aRequests[0], 'QUERY /api/api/users {"skip":0,"top":2}');
  });

  test('sort orders by a field, toggles its direction and goes back to the first page', async () => {
    // Renders the list and moves to the second page
    const List = list({ path: '/users', top: 2 }).bindView(fnView);
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    fireEvent.click(screen.getByText('next'));
    await expectNames('Ciro,Dora');

    // Sorts by name twice: ascending, then descending
    fireEvent.click(screen.getByText('sort'));
    await expectNames('Ana,Beto');
    fireEvent.click(screen.getByText('sort'));
    await expectNames('Eva,Dora');

    assert.ok(screen.getByText('page 0'));
  });

  test('reads the api store named in store', async () => {
    // Renders a list of another api store
    const List = list({ path: '/users', top: 1, store: 'admin' }).bindView(fnView);
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    fireEvent.click(screen.getByText('load'));
    await expectNames('Ana');

    assert.equal(aRequests[0], 'QUERY /api/admin/users {"skip":0,"top":1}');
  });

  test('it asks nothing until a method reads', async () => {
    // Renders a list without loading it
    const List = list({ path: '/users', top: 1 }).bindView(fnView);
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 50)));

    assert.equal(screen.getByRole('status').textContent, '');
    assert.equal(aRequests.length, 0);
  });

  test('without its api store it loads no items and asks nothing', async () => {
    // Renders a list of a store the app does not have
    const List = list({ path: '/users', top: 1, store: 'missing' }).bindView(fnView);
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    fireEvent.click(screen.getByText('load'));
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 50)));

    assert.equal(screen.getByRole('status').textContent, '');
    assert.equal(aRequests.length, 0);
  });
});
