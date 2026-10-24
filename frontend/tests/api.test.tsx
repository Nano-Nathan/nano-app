// First: Testing Library needs the DOM when it loads
import './dom';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  const fnJson = (oValue: NanoObject): [string, string] => [
    'application/json',
    JSON.stringify(oValue),
  ];

  if (sEntity === 'html') return ['text/html', '<h1>Not found</h1>'];
  if (sEntity === 'fail') return fnJson({ success: false, message: 'Failed' });
  if (sEntity === 'orders') return fnJson({ success: true, result: [] });
  if (sMethod === 'QUERY') return fnJson({ success: true, result: aUsers.slice(0, oBody.top) });
  if (sMethod === 'POST') aUsers = [...aUsers, oBody];
  if (sMethod === 'PUT') aUsers = aUsers.map(oUser => (oUser.id === Number(sId) ? oBody : oUser));
  if (sMethod === 'DELETE') aUsers = aUsers.filter(oUser => oUser.id !== Number(sId));
  if (sId && sMethod === 'GET')
    return fnJson({ success: true, result: aUsers.find(oUser => oUser.id === Number(sId)) });

  return fnJson({ success: true, result: aUsers });
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

/** Stores of a rendered tree, to call the api store as a controller does */
function renderStores(): NanoObject {
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
  return oStores;
}

/** Requests received for one method and path */
function count(sRequest: string): number {
  return aRequests.filter(sEntry => sEntry === sRequest).length;
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

  test('a read keeps its ApiResponse at its path and query, and the views get it', async () => {
    // A controller reads the users and the first one; a view gets both
    const usersController = createController(({ stores: { backend } }) => ({
      load: () => Promise.all([backend.read('/users'), backend.read('/users', { top: 1 })]),
    }));
    const List = usersController.bindView(({ stores: { backend }, load }) => (
      <div>
        <ul>
          {(backend.get('/users')?.result ?? []).map((oUser: NanoObject) => (
            <li key={oUser.id}>{oUser.name}</li>
          ))}
        </ul>
        <p>{`first ${backend.get('/users', { top: 1 })?.result?.[0]?.name}`}</p>
        <button onClick={load}>load</button>
      </div>
    ));
    render(
      <NanoAppProvider>
        <List />
      </NanoAppProvider>,
    );
    fireEvent.click(screen.getByText('load'));

    // Waits for the views: the first requests of the suite can take a while
    await waitFor(() => {
      assert.ok(screen.getByText('Beto', { selector: 'li' }));
      assert.ok(screen.getByText('first Ana'));
    });
    assert.deepEqual([...aRequests].sort(), ['GET /api/backend/users', 'QUERY /api/backend/users']);
  });

  test('a read answers from the store until a write on its path', async () => {
    // Reads the list and a user twice: each is asked once
    const { backend } = renderStores();
    await backend.read('/users');
    await backend.read('/users/7');
    const oKept = await backend.read('/users');
    await backend.read('/users/7');

    assert.deepEqual(oKept.result, aUsers);
    assert.equal(count('GET /api/backend/users'), 1);
    assert.equal(count('GET /api/backend/users/7'), 1);

    // Writes `/users/7`: only its own read asks again
    await backend.update('/users/7', { id: 7, name: 'Bruno' });
    const oRead = await backend.read('/users/7');
    await backend.read('/users');

    assert.equal(oRead.result.name, 'Bruno');
    assert.equal(backend.get('/users/7').result.name, 'Bruno');
    assert.equal(count('GET /api/backend/users/7'), 2);
    assert.equal(count('GET /api/backend/users'), 1);
  });

  test('a read keeps what the store had at its path', async () => {
    // Sets a value at `/users`, then reads `/users/7` and `/users`
    const { backend } = renderStores();
    backend.set('/users/page', 2);
    await backend.read('/users/7');
    await backend.read('/users');

    // Reads `/users/7` again from the store
    await backend.read('/users/7');

    assert.equal(backend.get('/users/page'), 2);
    assert.equal(backend.get('/users/7').result.name, 'Beto');
    assert.equal(count('GET /api/backend/users/7'), 1);
  });

  test('a read answered after a write is asked again', async () => {
    // Slows the backend, and writes while the read is out
    iDelay = 100;
    const { backend } = renderStores();
    const oRead = backend.read('/users/7');
    await backend.update('/users/7', { id: 7, name: 'Bruno' });
    await oRead;
    await backend.read('/users/7');

    assert.equal(count('GET /api/backend/users/7'), 2);
  });

  test('busy is true while a request is out', async () => {
    // Slows the backend and reads
    iDelay = 100;
    const { backend } = renderStores();
    const oRead = backend.read('/users');

    assert.equal(backend.get('/busy'), true);

    await oRead;

    assert.equal(backend.get('/busy'), false);
  });

  test('a read and a write return the ApiResponse, and an answer without JSON rejects', async () => {
    // Reads and writes a path that answers success: false, and one that answers HTML
    const { backend } = renderStores();
    const oFailed = { success: false, message: 'Failed' };

    assert.deepEqual(await backend.read('/fail'), oFailed);
    assert.deepEqual(backend.get('/fail'), oFailed);
    assert.deepEqual(await backend.create('/fail', {}), oFailed);
    await assert.rejects(backend.read('/html'));
    await assert.rejects(backend.delete('/html/1'));
  });
});
