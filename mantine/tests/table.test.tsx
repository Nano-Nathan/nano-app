// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataTable } from '../src/components/collection';
import TestApp from './provider';

const PORT = 4202;

// Users of the backend, and the requests it received
const USERS = [
  { id: 1, name: 'Ana', age: 30 },
  { id: 2, name: 'Beto', age: 41 },
];
const aRequests: string[] = [];

// Backend of the api store: keeps each request and answers the users
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    aRequests.push(`${oReq.method} ${oReq.url} ${sBody}`);

    // The columns when asked, no rows on `/empty`, or the users
    const isFields = JSON.parse(sBody || '{}').fields;
    const aValues = oReq.url?.endsWith('/empty') ? [] : USERS;
    const oResult = isFields
      ? { values: [], count: 0, fields: ['name', 'age'] }
      : { values: aValues, count: aValues.length };
    const sAnswer = JSON.stringify({ success: true, result: oResult });
    oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
  });
});

// Columns of the table: the name, and the age with its format
const COLUMNS = [
  { name: 'name', label: 'nano.login.email' },
  { name: 'age', format: (iAge: number) => `${iAge} years` },
];

before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
after(() => oBackend.close());

afterEach(() => {
  cleanup();
  aRequests.length = 0;
});

/** Renders the table of the users and waits for its rows */
async function renderTable(): Promise<void> {
  render(
    <TestApp>
      <DataTable path="/users" columns={COLUMNS} />
    </TestApp>,
  );
  await waitFor(() => assert.ok(screen.getByText('Beto')));
}

test('DataTable shows a column per field and a row per item, each cell as its format shows it', async () => {
  await renderTable();

  // The label of the first column, the text of its key without one, and the formatted age
  assert.ok(screen.getByText('Email'));
  assert.ok(screen.getByText('i18n.age'));
  assert.ok(screen.getByText('41 years'));
  assert.equal(aRequests[0], 'GET /api/api/users ');
});

test('DataTable without columns shows those of the table, and a row that invites to create the first one', async () => {
  render(
    <TestApp>
      <DataTable path="/empty" />
    </TestApp>,
  );

  // The columns of the table with their default labels, and the empty row
  await waitFor(() => assert.ok(screen.getByText('Nothing here yet. Create the first one.')));
  assert.ok(screen.getByText('Name'));
  assert.ok(screen.getByText('i18n.nano.label.age'));
});

test('DataTable opens the form of a row on a click, and an empty one to create', async () => {
  await renderTable();

  // A click on a row opens its form with its values and the button to delete it
  fireEvent.click(screen.getByText('Beto'));
  await waitFor(() => assert.ok(screen.getByText('Edit')));
  assert.ok(screen.getByDisplayValue('Beto'));
  assert.ok(screen.getByText('Delete'));

  // Cancel closes it, and Create opens an empty form, titled and sent with Create, without the button to delete
  fireEvent.click(screen.getByText('Cancel'));
  fireEvent.click(screen.getByText('Create'));
  await waitFor(() => assert.equal(screen.getAllByText('Create').length, 3));
  assert.equal(screen.queryByDisplayValue('Beto'), null);
});
