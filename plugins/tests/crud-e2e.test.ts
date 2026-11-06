// First: the DOM, before the frontend loads
import { APP_PORT } from './fixtures/dom';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import Database from '../../backend/src/database/Database';
import { prisma, startApp } from '../../backend/tests/helpers';
import { proxy } from '../../frontend/src/proxy';
import ApiStore from '../../frontend/src/stores/ApiStore';
import crud from '../crud';
import type { IncomingMessage, ServerResponse } from 'node:http';

const SCHEMA = '../backend/tests/fixtures/database/crud.prisma';

/** Answers a request of the browser with the frontend's proxy, as Next does */
async function serve(oReq: IncomingMessage, oRes: ServerResponse): Promise<void> {
  // Reads the body of the request
  let sBody = '';
  for await (const oChunk of oReq) sBody += oChunk;

  // Sends it through the proxy
  const { method, url, headers } = oReq;
  const oResponse = await proxy(
    new NextRequest(`http://localhost:${APP_PORT}${url}`, {
      method,
      headers: { 'content-type': headers['content-type'] ?? '' },
      body: sBody || undefined,
    }),
  );

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

    before(async () => {
      // What the consumer does by hand: apply their schema
      prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

      // Mounts the app's database and the plugin, with no route of the app
      await Database.init();
      await Database.mount('app', { enabled: true, schemaPath: SCHEMA });
      oBackend = await startApp([crud({ models: ['note'] })]);

      // Points the store `backend` to it and serves the app's origin
      process.env.API_BACKEND_URL = `${oBackend.url}/api`;
      await new Promise<void>(fnResolve => oApp.listen(APP_PORT, fnResolve));
    });

    after(async () => {
      // Deletes the notes of this run
      const oDb = Database.get('app');
      await oDb.note.deleteMany({ where: { title: { startsWith: sTag } } });
      await oDb.$disconnect();

      // Closes the backend and the app's origin
      await oBackend.close();
      await new Promise(fnResolve => oApp.close(fnResolve));
    });

    test('an api store reads, filters, creates, updates and deletes a model', async () => {
      // The store of the app, as a controller gets it
      const oStore = new ApiStore('backend');
      const oQuery = {
        filter: { title: { startsWith: sTag } },
        orderby: { title: 'asc' as const },
      };

      // Creates two notes and reads the first
      const { result: oFirst } = await oStore.create('/note', { title: `${sTag}-a` });
      await oStore.create('/note', { title: `${sTag}-b` });
      const { result: oRead } = await oStore.read(`/note/${oFirst.id}`);

      // Filters them, updates the first and filters again
      const { result: aCreated, count: iCreated } = await oStore.read('/note', oQuery);
      await oStore.update(`/note/${oFirst.id}`, { title: `${sTag}-c` });
      const { result: aUpdated } = await oStore.read('/note', oQuery);

      // Deletes the first and filters again
      await oStore.delete(`/note/${oFirst.id}`);
      const { result: aDeleted, count: iDeleted } = await oStore.read('/note', oQuery);

      // Checks each step, and the last answer kept in the store
      const fnTitles = (aNotes: { title: string }[]) => aNotes.map(oNote => oNote.title);
      assert.deepEqual(oRead, oFirst);
      assert.deepEqual(fnTitles(aCreated), [`${sTag}-a`, `${sTag}-b`]);
      assert.equal(iCreated, 2);
      assert.deepEqual(fnTitles(aUpdated), [`${sTag}-b`, `${sTag}-c`]);
      assert.deepEqual(fnTitles(aDeleted), [`${sTag}-b`]);
      assert.equal(iDeleted, 1);
      assert.deepEqual(oStore.get('/note', oQuery).result, aDeleted);
    });
  },
);
