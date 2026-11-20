// First: Testing Library needs the DOM when it loads
import './dom';
import './env/table';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createView } from '@nano-app/frontend';
import { TableController } from '../src';
import TestApp from './provider';
import type { ReactNode } from 'react';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

const PORT = 4201;

// Users of the backend, and the requests it received
const USERS = ['Ana', 'Beto', 'Ciro'].map((sName, iId) => ({ id: iId, name: sName }));
const aRequests: string[] = [];

// Backend behind the proxy: answers `GET /api/<store>/users` with every user
const oBackend = createServer((oReq, oRes) => {
  // Keeps the request, with its store
  aRequests.push(`${oReq.method} ${oReq.url}`);

  // Answers the list as crud does
  const sAnswer = JSON.stringify({ success: true, result: { values: USERS, hasMore: false } });
  oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
});

/** View of a table: the names of its rows, the name of a field shown by `cell` */
function view(users: TableController): ReactNode {
  const oField = { name: 'name', format: (oValue: unknown) => `@${oValue}` };
  return (
    <output>
      {users
        .rows()
        .map((oRow: NanoObject) => users.cell(oRow, oField))
        .join(',')}
    </output>
  );
}

/** Renders a view inside the provider */
function renderApp(oNode: ReactNode): void {
  render(<TestApp>{oNode}</TestApp>);
}

/** Waits until the table shows these names */
async function expectNames(sNames: string): Promise<void> {
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, sNames));
}

describe('table', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test without requests
    aRequests.length = 0;
  });

  test('reads the rows of its path when the view mounts, each cell as its format shows it', async () => {
    // Renders the users
    const Users = createView(TableController, view);
    renderApp(<Users path="/users" />);

    await expectNames('@Ana,@Beto,@Ciro');
    assert.deepEqual(aRequests, ['GET /api/api/users']);
  });

  test('isBusy is on only while a request of its own controller is out', async () => {
    // Renders the users and a table of another path that requests nothing
    class IdleController extends TableController {
      public onMount(): Promise<ApiResponse> {
        return Promise.resolve({});
      }
    }
    const Users = createView(TableController, users => <span>{`users ${users.isBusy()}`}</span>);
    const Idle = createView(IdleController, idle => <span>{`idle ${idle.isBusy()}`}</span>);
    renderApp(
      <>
        <Users path="/users" />
        <Idle path="/idle" />
      </>,
    );

    // The users are busy while their rows are out, the other never
    await waitFor(() => assert.ok(screen.getByText('users true')));
    assert.ok(screen.getByText('idle false'));
    await waitFor(() => assert.ok(screen.getByText('users false')));
  });

  test('a subclass reads the api store it gives', async () => {
    // Renders the users of another api store
    class AdminUsersController extends TableController {
      protected api = this.stores.admin;
    }
    const Users = createView(AdminUsersController, view);
    renderApp(<Users path="/users" />);
    await expectNames('@Ana,@Beto,@Ciro');

    assert.deepEqual(aRequests, ['GET /api/admin/users']);
  });
});
