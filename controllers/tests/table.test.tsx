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

// Backend behind the proxy: answers the users as crud does, or their columns when asked
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Keeps the request, with its store and its body
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`.trim());

    // The columns without rows when asked, or every user
    const isFields = JSON.parse(sBody || '{}').fields;
    const oResult = isFields
      ? { values: [], count: 0, fields: ['id', 'name'] }
      : { values: USERS, count: USERS.length };
    const sAnswer = JSON.stringify({ success: true, result: oResult });
    oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
  });
});

// Columns a view gives: the name only
const COLUMNS = [{ name: 'name' }];

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
    // Renders the users with the columns of the view
    const Users = createView(TableController, view);
    renderApp(<Users path="/users" columns={COLUMNS} />);

    // Reads only the rows: the view gave its columns
    await expectNames('@Ana,@Beto,@Ciro');
    assert.deepEqual(aRequests, ['GET /api/api/users']);
  });

  test('without columns it reads the names of the table once, beside the rows', async () => {
    // Renders the names of its fields
    const Users = createView(TableController, users => (
      <output>
        {users
          .fields()
          .map(oField => oField.name)
          .join(',')}
      </output>
    ));
    renderApp(<Users path="/users" />);

    // The columns of the table, read once with no rows
    await expectNames('id,name');
    assert.deepEqual([...aRequests].sort(), [
      'GET /api/api/users',
      'QUERY /api/api/users {"fields":true,"limit":0}',
    ]);
  });

  test('isBusy is on only while a request of its own controller is out', async () => {
    // Renders the users and a table of another path that requests nothing
    class IdleController extends TableController {
      public onMount(): Promise<ApiResponse[]> {
        return Promise.resolve([]);
      }
    }
    const Users = createView(TableController, users => <span>{`users ${users.isBusy()}`}</span>);
    const Idle = createView(IdleController, idle => <span>{`idle ${idle.isBusy()}`}</span>);
    renderApp(
      <>
        <Users path="/users" columns={COLUMNS} />
        <Idle path="/idle" />
      </>,
    );

    // The users are busy while their rows are out, the other never
    await waitFor(() => assert.ok(screen.getByText('users true')));
    assert.ok(screen.getByText('idle false'));
    await waitFor(() => assert.ok(screen.getByText('users false')));
  });

  test('isLoading is on until its rows answer, so a view waits instead of showing none', async () => {
    // Renders whether it is loading, on the first render too
    const Users = createView(TableController, users => (
      <span>{`loading ${users.isLoading()}`}</span>
    ));
    renderApp(<Users path="/users" columns={COLUMNS} />);

    // Loading before the request goes out, done once it answers
    assert.ok(screen.getByText('loading true'));
    await waitFor(() => assert.ok(screen.getByText('loading false')));
  });

  test('open shows the form of a row with its values, and the row stays while it closes', async () => {
    // Renders whether the form is open, the row's name and the value of its form
    const Users = createView(TableController, users => (
      <>
        <button onClick={() => users.open('edit', USERS[1])}>edit</button>
        <button onClick={users.close}>close</button>
        <output>
          {`${users.opened('edit')} ${users.row().name} ${users.stores.app.get('/form/table/users/values/name')}`}
        </output>
      </>
    ));
    renderApp(<Users path="/users" columns={COLUMNS} />);

    // Opens the form of Beto with its value
    screen.getByText('edit').click();
    await expectNames('true Beto Beto');

    // Closed, the row is still Beto, so a view that fades out keeps its title
    screen.getByText('close').click();
    await expectNames('false Beto Beto');
  });

  test('save updates the open row or creates one, remove deletes it, then the rows are read again', async () => {
    // Renders buttons that open a row, a new one or its deletion, and save or remove
    const Users = createView(TableController, users => (
      <>
        <button onClick={() => users.open('edit', USERS[1])}>edit</button>
        <button onClick={() => users.open('edit')}>new</button>
        <button onClick={() => users.open('delete', USERS[2])}>delete</button>
        <button onClick={() => users.save({ name: 'Bea' })}>save</button>
        <button onClick={users.remove}>remove</button>
        <output>{`${users.opened('edit')} ${users.opened('delete')}`}</output>
      </>
    ));
    renderApp(<Users path="/users" columns={COLUMNS} />);
    await waitFor(() => assert.equal(aRequests.length, 1));

    // Updates the open row, closes the form and reads the rows again
    screen.getByText('edit').click();
    screen.getByText('save').click();
    await expectNames('false false');
    await waitFor(() => assert.equal(aRequests.length, 3));

    // Creates a new one
    screen.getByText('new').click();
    screen.getByText('save').click();
    await waitFor(() => assert.equal(aRequests.length, 5));

    // Deletes the row of the confirmation
    screen.getByText('delete').click();
    screen.getByText('remove').click();
    await waitFor(() => assert.equal(aRequests.length, 7));
    assert.deepEqual(
      aRequests.slice(1).filter(sRequest => !sRequest.startsWith('GET')),
      [
        'PUT /api/api/users/1 {"name":"Bea"}',
        'POST /api/api/users {"name":"Bea"}',
        'DELETE /api/api/users/2',
      ],
    );
  });

  test('a subclass reads the api store it gives', async () => {
    // Renders the users of another api store
    class AdminUsersController extends TableController {
      protected api = this.stores.admin;
    }
    const Users = createView(AdminUsersController, view);
    renderApp(<Users path="/users" columns={COLUMNS} />);
    await expectNames('@Ana,@Beto,@Ciro');

    assert.deepEqual(aRequests, ['GET /api/admin/users']);
  });
});
