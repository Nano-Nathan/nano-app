// First: Testing Library needs the DOM when it loads
import './dom';
import './env/list';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { API_STORE_TYPE } from '@nano-app/core/const';
import list from '../list';
import TestApp from './provider';

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
    const { offset = 0, limit, orderBy = {} } = JSON.parse(sBody || '{}');
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);

    // Orders by name when asked, and slices the page
    const iSign = orderBy.name === 'desc' ? -1 : 1;
    const aSorted = [...USERS].sort((oA, oB) => iSign * oA.name.localeCompare(oB.name));
    const sAnswer = JSON.stringify({
      success: true,
      result: aSorted.slice(offset, offset + limit),
    });
    oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
  });
});

/** View of a list: its names, its page read from the store and its buttons */
const fnView: Parameters<ReturnType<typeof list>['bindView']>[0] = ({
  stores,
  load,
  items,
  next,
  prev,
  sort,
}) => (
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
    const List = list({ path: '/users', limit: 2 }).bindView(fnView);
    render(
      <TestApp>
        <List />
      </TestApp>,
    );
    await expectNames('Ana,Beto');

    // Goes to the next page, then back twice: the first page is the last one back
    fireEvent.click(screen.getByText('next'));
    await expectNames('Ciro,Dora');
    fireEvent.click(screen.getByText('prev'));
    fireEvent.click(screen.getByText('prev'));
    await expectNames('Ana,Beto');

    assert.ok(screen.getByText('page 0'));
    assert.equal(aRequests[0], 'QUERY /api/api/users {"offset":0,"limit":2}');
  });

  test('sort orders by a field, toggles its direction and goes back to the first page', async () => {
    // Renders the list and moves to the second page
    const List = list({ path: '/users', limit: 2 }).bindView(fnView);
    render(
      <TestApp>
        <List />
      </TestApp>,
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
    const List = list({ path: '/users', limit: 1, store: 'admin' }).bindView(fnView);
    render(
      <TestApp>
        <List />
      </TestApp>,
    );
    await expectNames('Ana');

    assert.equal(aRequests[0], 'QUERY /api/admin/users {"offset":0,"limit":1}');
  });

  test('reads the first page when the view mounts, and load reads it from the store', async () => {
    // Renders a list without clicking anything
    const List = list({ path: '/users', limit: 1 }).bindView(fnView);
    render(
      <TestApp>
        <List />
      </TestApp>,
    );
    await expectNames('Ana');

    // Loads it again: the store answers without asking
    fireEvent.click(screen.getByText('load'));
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 50)));

    assert.deepEqual(aRequests, ['QUERY /api/api/users {"offset":0,"limit":1}']);
  });

  test('without its api store it fails, naming the store', () => {
    // Renders a list of a store the app does not have
    const List = list({ path: '/users', limit: 1, store: 'missing' }).bindView(fnView);

    // Checks that the render stops with the store to add
    assert.throws(
      () =>
        render(
          <TestApp>
            <List />
          </TestApp>,
        ),
      { message: 'The store "missing" does not exist. Add src/stores/missing.store.ts.' },
    );
  });
});
