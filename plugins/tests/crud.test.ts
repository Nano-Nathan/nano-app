import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../../backend/src/database/Database';
import { push, request, startApp } from '../../backend/tests/helpers';
import * as schema from '../../backend/tests/fixtures/database/crud';
import crud from '../crud';
import type { NanoObject } from '@nano-app/backend';
import type { TestResponse } from '../../backend/tests/helpers';

/** Sends a request with a JSON body */
function send(
  sMethod: string,
  sUrl: string,
  sPath: string,
  oBody: NanoObject,
): Promise<TestResponse> {
  return request(sUrl, sPath, {
    method: sMethod,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oBody),
  });
}

describe('crud', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  const sTag = `crud-${Date.now()}`;
  let oServer: Awaited<ReturnType<typeof startApp>>;
  let sCommentId: string;
  let iNoteId: number;

  before(async () => {
    // What the consumer does by hand: apply their schema
    await push(schema, ['crud_test']);

    // Mounts the app's database, then the plugin after it
    const oDb = await Database.mount('app', { schema });
    oServer = await startApp([crud({ models: ['note', 'comment'], schema })]);

    // Two notes of this run, the first with a comment
    const [oNote] = await oDb
      .insert(schema.note)
      .values({ title: `${sTag}-a` })
      .returning();
    await oDb.insert(schema.note).values({ title: `${sTag}-b` });
    const [oComment] = await oDb
      .insert(schema.comment)
      .values({ text: 'first', noteId: oNote.id })
      .returning();
    sCommentId = oComment.id;
    iNoteId = oNote.id;
  });

  after(async () => {
    // Closes the pool and the server
    await Database.get('app').$client.end();
    await oServer.close();
  });

  test('a model out of the list answers 404', async () => {
    // Reads a model of the schema the app does not list
    const { status } = await request(oServer.url, '/api/secret');
    assert.equal(status, 404);
  });

  test('GET lists a model', async () => {
    // Reads the notes without parameters
    const { status, body } = await request(oServer.url, '/api/note');

    // Checks the list
    assert.equal(status, 200);
    assert.ok(body.result.length >= 2);
  });

  test('QUERY filters, orders, pages and picks columns', async () => {
    // Reads the first note of this run
    const { body } = await send('QUERY', oServer.url, '/api/note', {
      where: { title: { like: `${sTag}%` } },
      orderBy: { title: 'asc' },
      limit: 1,
      offset: 0,
      columns: { title: true },
    });

    // Checks the page and the fields
    assert.deepEqual(body.result, [{ title: `${sTag}-a` }]);
  });

  test('QUERY reads one record by its string id', async () => {
    // Reads the comment
    const { status, body } = await send('QUERY', oServer.url, `/api/comment/${sCommentId}`, {});

    // Checks the record
    assert.equal(status, 200);
    assert.equal(body.result.text, 'first');
  });

  test('POST creates, PUT updates the fields sent and DELETE deletes', async () => {
    // Creates a comment on the first note
    const { body: oCreated } = await send('POST', oServer.url, '/api/comment', {
      text: 'second',
      noteId: iNoteId,
    });
    const sPath = `/api/comment/${oCreated.result.id}`;

    // Updates only its text
    const { body: oUpdated } = await send('PUT', oServer.url, sPath, { text: 'edited' });

    // Deletes it, then reads it
    const { body: oDeleted } = await request(oServer.url, sPath, { method: 'DELETE' });
    const { status } = await request(oServer.url, sPath);

    // Checks each change
    assert.equal(oCreated.result.text, 'second');
    assert.deepEqual(oUpdated.result, { ...oCreated.result, text: 'edited' });
    assert.equal(oDeleted.result.text, 'edited');
    assert.equal(status, 404);
  });

  test('a query never leaves its table: a relation in where or with answers 400', async () => {
    // Filters comments by their note, and loads the note of each one
    const oWhere = await send('QUERY', oServer.url, '/api/comment', {
      where: { note: { title: 'a' } },
    });
    const oWith = await send('QUERY', oServer.url, '/api/comment', { with: { note: true } });
    assert.deepEqual([oWhere.status, oWith.status], [400, 400]);
  });

  test('Postgres errors answer their status without their message', async () => {
    // A comment nobody created: read, updated and deleted
    const sPath = '/api/comment/00000000-0000-0000-0000-000000000000';
    const { status: iRead, body: oRead } = await request(oServer.url, sPath);
    const { status: iUpdate } = await send('PUT', oServer.url, sPath, { text: 'edited' });
    const { status: iDelete } = await request(oServer.url, sPath, { method: 'DELETE' });

    // A comment of a note that does not exist, and a note without its title
    const { status: iConflict, body: oConflict } = await send('POST', oServer.url, '/api/comment', {
      text: 'orphan',
      noteId: 0,
    });
    const { status: iInvalid, body: oInvalid } = await send('POST', oServer.url, '/api/note', {
      name: 'unknown field',
    });

    // Checks each status, and that the messages name no table or column
    assert.deepEqual([iRead, iUpdate, iDelete, iConflict, iInvalid], [404, 404, 404, 409, 400]);
    assert.deepEqual(
      [oRead.message, oConflict.message, oInvalid.message],
      ['Not found', 'Conflict', 'Invalid request'],
    );
  });
});
