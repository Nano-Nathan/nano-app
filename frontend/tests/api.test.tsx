// First: Testing Library needs the DOM when it loads
import './dom';
import './env/api';
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { REQUEST_FAILED } from '@nano-app/core/const';
import Controller from '../src/controllers/Controller';
import createView from '../src/creators/createView';
import TestApp, { renderStores } from './provider';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError } from '../src/types/store';

const PORT = 4200;

// Delay of the backend's answers, and whether `/count` already answered
let iDelay = 0;
let isCounted = false;

/** Answers the backend's routes: `/fail`, `/silent`, `/count` and `/html`, any other echoes */
function answer(sMethod: string, sUrl: string, sBody: string): [number, string, string] {
  const sPath = sUrl.replace('/api/backend', '');
  const fnJson = (iStatus: number, oValue: NanoObject): [number, string, string] => [
    iStatus,
    'application/json',
    JSON.stringify(oValue),
  ];

  // Answers each special route
  if (sPath === '/html') return [404, 'text/html', '<h1>Not found</h1>'];
  if (sPath === '/fail') return fnJson(400, { success: false, message: 'Failed' });
  if (sPath === '/silent') return fnJson(500, { success: false });
  if (sPath === '/count') {
    const oAnswer = isCounted ? { success: true } : { success: true, count: 5 };
    isCounted = true;
    return fnJson(200, oAnswer);
  }

  // Echoes the request
  return fnJson(200, { success: true, result: { method: sMethod, path: sPath, body: sBody } });
}

// Backend behind the proxy: the test serves `/api/backend/...` on the DOM's origin
const oBackend = createServer((oReq, oRes) => {
  let sBody = '';
  oReq.on('data', oChunk => (sBody += oChunk));
  oReq.on('end', () => {
    // Closes `/drop` without an answer
    const { method = '', url = '' } = oReq;
    if (url.endsWith('/drop')) return oReq.socket.destroy();

    // Answers after the delay
    const [iStatus, sType, sAnswer] = answer(method, url, sBody);
    setTimeout(() => oRes.writeHead(iStatus, { 'content-type': sType }).end(sAnswer), iDelay);
  });
});

describe('api store', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);
  beforeEach(() => {
    // Starts each test with no delay and `/count` unanswered
    iDelay = 0;
    isCounted = false;
  });

  test('GET keeps its ApiResponse and status at its path, and the view renders it', async () => {
    // A controller that reads the users when its view mounts
    class UsersController extends Controller {
      public onMount(): void {
        // Reads the users
        this.stores.backend.GET('/users');
      }
    }
    const Users = createView(UsersController, users => {
      const oRead = users.stores.backend.get('/users');
      return <p>{`${oRead?.result?.method} ${oRead?.result?.path} ${oRead?.status}`}</p>;
    });
    render(
      <TestApp>
        <Users />
      </TestApp>,
    );

    // Waits for the view: the first request of the suite can take a while
    await waitFor(() => assert.ok(screen.getByText('GET /users 200')), { timeout: 5000 });
  });

  test('QUERY sends the query as its body and keeps its answer apart from GET', async () => {
    // Reads the same path without a query and with one
    const { backend } = renderStores();
    await backend.GET('/users');
    const oQuery = await backend.QUERY('/users', { limit: 1 });

    assert.deepEqual(oQuery.result, { method: 'QUERY', path: '/users', body: '{"limit":1}' });
    assert.equal(backend.get('/users').result.method, 'GET');
    assert.equal(backend.get('/users', { limit: 1 }).result.method, 'QUERY');
  });

  test('a read keeps the fields of the last answer that the new one does not bring', async () => {
    // Reads a path twice: only the first answer brings a count
    const { backend } = renderStores();
    await backend.GET('/count');
    await backend.GET('/count');

    assert.equal(backend.get('/count').count, 5);
  });

  test('POST, PUT and DELETE send their method and body, and keep nothing', async () => {
    // Writes the same path with each method
    const { backend } = renderStores();
    const aResults = [
      await backend.POST('/users', { name: 'Ana' }),
      await backend.PUT('/users', { name: 'Eva' }),
      await backend.DELETE('/users'),
    ];

    assert.deepEqual(
      aResults.map(oResult => oResult.result),
      [
        { method: 'POST', path: '/users', body: '{"name":"Ana"}' },
        { method: 'PUT', path: '/users', body: '{"name":"Eva"}' },
        { method: 'DELETE', path: '/users', body: '' },
      ],
    );
    assert.equal(backend.get('/users'), undefined);
  });

  test('busy is true while a request is out', async () => {
    // Sends a slow request and reads busy before and after its answer
    iDelay = 50;
    const { backend } = renderStores();
    const oRead = backend.GET('/users');

    assert.equal(backend.get('/busy'), true);
    await oRead;
    assert.equal(backend.get('/busy'), false);
  });

  test('a failed request returns its ApiResponse and adds its error to the store', async () => {
    // Fails with a message, then without one
    const { backend } = renderStores();
    const oFailed = await backend.POST('/fail', {});
    await backend.GET('/silent');

    // Checks the answer and both errors, the second with the default message
    assert.deepEqual(oFailed, { success: false, message: 'Failed', status: 400 });
    const aErrors: ApiError[] = backend.get('/error/list');
    assert.deepEqual(
      aErrors.map(({ message, status }) => [message, status]),
      [
        ['Failed', 400],
        [REQUEST_FAILED, 500],
      ],
    );
    assert.equal(typeof aErrors[0].timestamp, 'number');
  });

  test('an answer without JSON, or no answer, is a failed ApiResponse', async () => {
    // Reads an HTML page, then a path that closes without an answer
    const { backend } = renderStores();

    assert.deepEqual(await backend.GET('/html'), {
      success: false,
      message: REQUEST_FAILED,
      result: '<h1>Not found</h1>',
    });
    assert.deepEqual(await backend.DELETE('/drop'), { success: false, message: REQUEST_FAILED });
    assert.equal(backend.get('/error/list').length, 2);
    assert.equal(backend.get('/busy'), false);
  });
});
