// First: the DOM, before the frontend loads
import { APP_PORT } from './fixtures/dom';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import DatabaseManager from '../../backend/src/database/DatabaseManager';
import Drizzle from '../../backend/src/database/clients/Drizzle';
import { push, startApp } from '../../backend/tests/helpers';
import * as schema from '../../backend/tests/fixtures/database/crud';
import { proxy } from '../../frontend/src/proxy';
import { follow } from '../../frontend/tests/helpers';
import ApiStore from '../../frontend/src/stores/ApiStore';
import crud from '../crud';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** Answers a request of the browser with the frontend's proxy, as Next does */
async function serve(oReq: IncomingMessage, oRes: ServerResponse): Promise<void> {
  // Reads the body of the request
  let sBody = '';
  for await (const oChunk of oReq) sBody += oChunk;

  // Sends it through the proxy, and its rewrite to the backend
  const { method, url, headers } = oReq;
  const oInit = { method, body: sBody || undefined };
  const oRewrite = await proxy(
    new NextRequest(`http://localhost:${APP_PORT}${url}`, {
      ...oInit,
      headers: { 'content-type': headers['content-type'] ?? '' },
    }),
  );
  const oResponse = await follow(oRewrite, oInit);

  // Answers with the backend's status and body
  oRes.writeHead(oResponse.status, { 'content-type': 'application/json' });
  oRes.end(await oResponse.text());
}

describe(
  'crud from the frontend',
  { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' },
  () => {
    const sTag = `crud-e2e-${Date.now()}`;
    const oApp = createServer(serve);
    let oBackend: Awaited<ReturnType<typeof startApp>>;
    let oDb: any;

    before(async () => {
      // What the consumer does by hand: apply their schema
      await push(schema, ['crud_test']);

      // Mounts the app's database and the plugin under /api, with no route of the app
      const oAppDB = new Drizzle('app', { relations: schema.relations });
      oDb = await DatabaseManager.mount(oAppDB);
      oBackend = await startApp(
        [crud({ models: { note: schema.note }, basePath: '/api' })],
        oAppDB,
      );

      // Points the store `backend` to it and serves the app's origin
      process.env.API_BACKEND_URL = `${oBackend.url}/api`;
      await new Promise<void>(fnResolve => oApp.listen(APP_PORT, fnResolve));
    });

    after(async () => {
      // Closes the pool
      await oDb.$client.end();

      // Closes the backend and the app's origin
      await oBackend.close();
      await new Promise(fnResolve => oApp.close(fnResolve));
    });

    test('an api store reads, filters, creates, updates and deletes a model', async () => {
      // The store of the app, as a controller gets it
      const oStore = new ApiStore('backend');
      const oQuery = {
        where: { title: { like: `${sTag}%` } },
        orderBy: { title: 'asc' as const },
      };

      // Creates two notes and reads the first
      const { result: oFirst } = await oStore.create('/note', { title: `${sTag}-a` });
      await oStore.create('/note', { title: `${sTag}-b` });
      const { result: oRead } = await oStore.read(`/note/${oFirst.id}`);

      // Filters them, updates the first and filters again
      const { result: aCreated } = await oStore.read('/note', oQuery);
      await oStore.update(`/note/${oFirst.id}`, { title: `${sTag}-c` });
      const { result: aUpdated } = await oStore.read('/note', oQuery);

      // Deletes the first and filters again
      await oStore.delete(`/note/${oFirst.id}`);
      const { result: aDeleted } = await oStore.read('/note', oQuery);

      // Checks each step, and the last answer kept in the store
      const fnTitles = (aNotes: { title: string }[]) => aNotes.map(oNote => oNote.title);
      assert.deepEqual(oRead, oFirst);
      assert.deepEqual(fnTitles(aCreated), [`${sTag}-a`, `${sTag}-b`]);
      assert.deepEqual(fnTitles(aUpdated), [`${sTag}-b`, `${sTag}-c`]);
      assert.deepEqual(fnTitles(aDeleted), [`${sTag}-b`]);
      assert.deepEqual(oStore.get('/note', oQuery).result, aDeleted);
    });
  },
);
