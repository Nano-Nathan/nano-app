// First: Testing Library needs the DOM when it loads
import './dom';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { STORES_ENV } from '@nano-app/core/const';
import createController from '../src/creators/createController';
import { NanoAppProvider } from '../src/react/NanoAppProvider';
import type { NanoObject } from '@nano-app/core/types/objects';

const PORT = 4200;

// Requests the backend received, by method and path
const aRequests: string[] = [];

// Users of the backend, and a delay for its answers
let aUsers: NanoObject[];
let iDelay = 0;

/** Answers the backend's routes: `/users` and `/users/:id` in memory, `/fail` and `/html` */
function answer(sMethod: string, sUrl: string, sBody: string): [string, string] {
  const [, , , sEntity, sId] = sUrl.split('/');
  const oBody = sBody ? JSON.parse(sBody) : {};
  const json = (oValue: NanoObject): [string, string] => [
    'application/json',
    JSON.stringify(oValue),
  ];

  if (sEntity === 'html') return ['text/html', '<h1>Not found</h1>'];
  if (sEntity === 'fail') return json({ success: false, message: 'Failed' });
  if (sEntity === 'orders') return json({ success: true, result: [] });
  if (sMethod === 'QUERY') return json({ success: true, result: aUsers.slice(0, oBody.top) });
  if (sMethod === 'POST') aUsers = [...aUsers, oBody];
  if (sMethod === 'PUT') aUsers = aUsers.map(oUser => (oUser.id === Number(sId) ? oBody : oUser));
  if (sMethod === 'DELETE') aUsers = aUsers.filter(oUser => oUser.id !== Number(sId));
  if (sId && sMethod === 'GET')
    return json({ success: true, result: aUsers.find(oUser => oUser.id === Number(sId)) });

  return json({ success: true, result: aUsers });
}

// Backend behind the proxy: the test serves `/api/backend/...` on the DOM's origin
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    const { method = '', url = '' } = oReq;
    aRequests.push(`${method} ${url}`);
    const [sType, sAnswer] = answer(method, url, sBody);
    setTimeout(() => oRes.writeHead(200, { 'content-type': sType }).end(sAnswer), iDelay);
  });
});

// Store of the backend, as `withNanoApp` inlines it
process.env[STORES_ENV] = JSON.stringify({ backend: { type: 'api' } });

const usersController = createController(({ stores: { backend } }) => ({
  rename: (sName: string) => backend.update('/users', 7, { id: 7, name: sName }),
  addOrder: () => backend.create('/orders', { id: 1 }),
}));

// A list, a detail and the first user, all of `/users`
const List = usersController.bindView(({ stores: { backend } }) => (
  <ul>
    {(backend.read('/users') ?? []).map((oUser: NanoObject) => (
      <li key={oUser.id}>{oUser.name}</li>
    ))}
  </ul>
));
const Detail = usersController.bindView(({ stores: { backend }, rename, addOrder }) => (
  <div>
    <output>{backend.read('/users/7')?.name}</output>
    <span>{`busy ${backend.busy}`}</span>
    <button onClick={() => rename('Bruno')}>rename</button>
    <button onClick={addOrder}>order</button>
  </div>
));
const First = usersController.bindView(({ stores: { backend } }) => (
  <p>{`first ${backend.read('/users', { top: 1 })?.[0]?.name}`}</p>
));

/** Requests received for one method and path */
function count(sRequest: string): number {
  return aRequests.filter(sEntry => sEntry === sRequest).length;
}

/** Lets the pending requests answer and the views render them */
async function settle(): Promise<void> {
  await act(() => new Promise(fnResolve => setTimeout(fnResolve, iDelay + 50)));
}

describe('api store', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test with a fresh backend and requests
    aRequests.length = 0;
    aUsers = [
      { id: 3, name: 'Ana' },
      { id: 7, name: 'Beto' },
    ];
    iDelay = 0;
  });

  test('read asks the backend once per path and query, and the views render the result', async () => {
    // Two views read `/users`, one `/users/7`, one `/users` with a query
    render(
      <NanoAppProvider>
        <List />
        <List />
        <Detail />
        <First />
      </NanoAppProvider>,
    );
    await settle();

    assert.equal(screen.getAllByText('Beto', { selector: 'li' }).length, 2);
    assert.equal(screen.getByRole('status').textContent, 'Beto');
    assert.ok(screen.getByText('first Ana'));
    assert.deepEqual([...aRequests].sort(), [
      'GET /api/backend/users',
      'GET /api/backend/users/7',
      'QUERY /api/backend/users',
    ]);
  });

  test('a write marks its entity: every read of it asks again, other entities do not', async () => {
    // Renders the list and the detail, then writes another entity
    render(
      <NanoAppProvider>
        <List />
        <Detail />
      </NanoAppProvider>,
    );
    await settle();
    fireEvent.click(screen.getByText('order'));
    await settle();

    assert.equal(count('GET /api/backend/users'), 1);

    // Renames user 7: the list and the detail read again
    fireEvent.click(screen.getByText('rename'));
    await settle();

    assert.equal(screen.getByRole('status').textContent, 'Bruno');
    assert.ok(screen.getByText('Bruno', { selector: 'li' }));
    assert.equal(count('PUT /api/backend/users/7'), 1);
    assert.equal(count('GET /api/backend/users'), 2);
    assert.equal(count('GET /api/backend/users/7'), 2);
  });

  test('a read answered after a write is asked again', async () => {
    // Slows the backend, renders the detail and renames before its read answers
    iDelay = 100;
    render(
      <NanoAppProvider>
        <Detail />
      </NanoAppProvider>,
    );
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 10)));
    fireEvent.click(screen.getByText('rename'));
    await settle();
    await settle();

    assert.equal(screen.getByRole('status').textContent, 'Bruno');
    assert.equal(count('GET /api/backend/users/7'), 2);
  });

  test('busy counts the requests in progress', async () => {
    // Slows the backend and renders the detail
    iDelay = 100;
    render(
      <NanoAppProvider>
        <Detail />
      </NanoAppProvider>,
    );
    await act(() => new Promise(fnResolve => setTimeout(fnResolve, 10)));

    assert.ok(screen.getByText('busy 1'));

    await settle();

    assert.ok(screen.getByText('busy 0'));
  });

  test('a failed read keeps what there was and is not asked again until a write', async () => {
    // Reads a path that answers success: false, and renders it again
    const Fail = createController(() => ({})).bindView(({ stores: { backend } }) => (
      <p>{`fail ${backend.read('/fail')} busy ${backend.busy}`}</p>
    ));
    render(
      <NanoAppProvider>
        <Fail />
      </NanoAppProvider>,
    );
    await settle();
    await settle();

    assert.ok(screen.getByText('fail undefined busy 0'));
    assert.equal(count('GET /api/backend/fail'), 1);
  });

  test('a write returns the ApiResponse, and an answer without JSON throws', async () => {
    // Writes on the backend through an api store of the tree
    let oStores: NanoObject = {};
    const Grab = createController(({ stores }) => {
      oStores = stores;
      return {};
    }).bindView(() => null);
    render(
      <NanoAppProvider>
        <Grab />
      </NanoAppProvider>,
    );

    assert.deepEqual(await oStores.backend.create('/fail', {}), {
      success: false,
      message: 'Failed',
    });
    await assert.rejects(oStores.backend.delete('/html', 1), {
      message: '[nano-app] [ERROR] DELETE /api/backend/html/1 answered 200 without JSON.',
    });
  });
});
