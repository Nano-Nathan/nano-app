// First: Testing Library needs the DOM when it loads
import './dom';
import './env/collection';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import CollectionController from '../collection';
import TestApp from './provider';
import type { ReactNode } from 'react';

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

/** Users two per page */
class UsersController extends CollectionController {
  public name = 'users';
  public path = '/users';
  public limit = 2;
}

/** View of a collection: its names, its page from the app store and its buttons */
function view(users: CollectionController): ReactNode {
  return (
    <div>
      <output>{(users.items()?.result ?? []).map((oUser: User) => oUser.name).join(',')}</output>
      <span>{`page ${users.stores.app.get('/collection/users/page') ?? 0}`}</span>
      <button onClick={users.next}>next</button>
      <button onClick={users.prev}>prev</button>
      <button onClick={() => users.sort('name')}>sort</button>
    </div>
  );
}

/** Renders a view inside the provider */
function renderApp(oNode: ReactNode): void {
  render(<TestApp>{oNode}</TestApp>);
}

/** Waits until the collection shows these names */
async function expectNames(sNames: string): Promise<void> {
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, sNames));
}

describe('collection', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests
    aRequests.length = 0;
  });

  test('reads the first page when the view mounts, and next and prev move between pages', async () => {
    // Renders the users
    const Users = createView(UsersController, view);
    renderApp(<Users />);
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
    // Renders the users and moves to the second page
    const Users = createView(UsersController, view);
    renderApp(<Users />);
    fireEvent.click(screen.getByText('next'));
    await expectNames('Ciro,Dora');

    // Sorts by name twice: ascending, then descending
    fireEvent.click(screen.getByText('sort'));
    await expectNames('Ana,Beto');
    fireEvent.click(screen.getByText('sort'));
    await expectNames('Eva,Dora');

    assert.ok(screen.getByText('page 0'));
  });

  test('a subclass reads the api store named in store', async () => {
    // Renders the users of another api store, one per page
    class AdminUsersController extends UsersController {
      public store = 'admin';
      public limit = 1;
    }
    const Users = createView(AdminUsersController, view);
    renderApp(<Users />);
    await expectNames('Ana');

    assert.equal(aRequests[0], 'QUERY /api/admin/users {"offset":0,"limit":1}');
  });

  test('more adds the next page to the pages read so far', async () => {
    // Renders the users with every page read with more
    const Users = createView(UsersController, users => (
      <div>
        <output>{(users.pages()?.result ?? []).map((oUser: User) => oUser.name).join(',')}</output>
        <button onClick={users.more}>more</button>
      </div>
    ));
    renderApp(<Users />);

    // Reads three pages: the third one has one user
    fireEvent.click(screen.getByText('more'));
    await expectNames('Ana,Beto');
    fireEvent.click(screen.getByText('more'));
    await expectNames('Ana,Beto,Ciro,Dora');
    fireEvent.click(screen.getByText('more'));
    await expectNames('Ana,Beto,Ciro,Dora,Eva');
  });
});
