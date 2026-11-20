import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createInsertSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import DatabaseManager from '../../backend/src/database/DatabaseManager';
import Drizzle from '../../backend/src/database/clients/Drizzle';
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
  let oDb: any;

  before(async () => {
    // What the consumer does by hand: apply their schema
    await push(schema, ['crud_test']);

    // Mounts the app's database, then the plugin after it
    const oAppDB = new Drizzle('app', { relations: schema.relations });
    oDb = await DatabaseManager.mount(oAppDB);
    // The app checks the comments: what a `POST` sends, and how many a `QUERY` asks for
    const oValidation = {
      create: createInsertSchema(schema.comment),
      read: z.looseObject({ limit: z.number().max(50).optional() }),
    };
    oServer = await startApp(
      [
        crud({
          models: ['note', 'comment'],
          validations: { comment: oValidation },
        }),
      ],
      oAppDB,
    );

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
    await oDb.$client.end();
    await oServer.close();
  });

  test('a model out of the list answers 404', async () => {
    // Reads a model of the schema the app does not list
    const { status } = await request(oServer.url, '/secret');
    assert.equal(status, 404);
  });

  test('GET lists a model', async () => {
    // Reads the notes without parameters
    const { status, body } = await request(oServer.url, '/note');

    // Checks the list and its count
    assert.equal(status, 200);
    assert.ok(body.result.values.length >= 2);
    assert.equal(body.result.count, body.result.values.length);
  });

  test('QUERY filters, orders, pages and picks columns', async () => {
    // Reads the first note of this run
    const { body } = await send('QUERY', oServer.url, '/note', {
      where: { title: { like: `${sTag}%` } },
      orderBy: { title: 'asc' },
      limit: 1,
      offset: 0,
      columns: { title: true },
    });

    // Checks the page, its fields and its count
    assert.deepEqual(body.result, { values: [{ title: `${sTag}-a` }], count: 1 });
  });

  test('QUERY with fields answers the names of the columns of the table', async () => {
    // Asks the columns of the comments, with no rows
    const { body } = await send('QUERY', oServer.url, '/comment', { fields: true, limit: 0 });

    // Checks the names, without rows
    assert.deepEqual(body.result, { values: [], count: 0, fields: ['id', 'text', 'noteId'] });
  });

  test('QUERY reads one record by its string id', async () => {
    // Reads the comment
    const { status, body } = await send('QUERY', oServer.url, `/comment/${sCommentId}`, {});

    // Checks the record
    assert.equal(status, 200);
    assert.equal(body.result.text, 'first');
  });

  test('POST creates, PUT updates the fields sent and DELETE deletes', async () => {
    // Creates a comment on the first note
    const oCreated = await send('POST', oServer.url, '/comment', {
      text: 'second',
      noteId: iNoteId,
    });
    const sPath = `/comment/${oCreated.body.result.id}`;

    // Updates only its text
    const oUpdated = await send('PUT', oServer.url, sPath, { text: 'edited' });

    // Deletes it, then reads it
    const oDeleted = await request(oServer.url, sPath, { method: 'DELETE' });
    const { status } = await request(oServer.url, sPath);

    // Checks each change
    assert.equal(oCreated.body.result.text, 'second');
    assert.deepEqual(oUpdated.body.result, { ...oCreated.body.result, text: 'edited' });
    assert.equal(oDeleted.body.result.text, 'edited');
    assert.equal(status, 404);
  });

  test('a body that breaks the validation of the app answers 400 with the field and the rule', async () => {
    // Creates a comment whose text is a number, and asks for more comments than the app allows
    const oInsert = await send('POST', oServer.url, '/comment', { text: 1, noteId: iNoteId });
    const oQuery = await send('QUERY', oServer.url, '/comment', { limit: 51 });

    // Checks that both name their field
    assert.deepEqual([oInsert.status, oQuery.status], [400, 400]);
    assert.match(oInsert.body.message, /^text: /);
    assert.match(oQuery.body.message, /^limit: /);
  });

  test('a query filters by a relation and loads it', async () => {
    // Reads the comments of the first note of this run, each with its note
    const { status, body } = await send('QUERY', oServer.url, '/comment', {
      where: { note: { title: `${sTag}-a` } },
      with: { note: true },
    });

    // Checks the comment, the note it brings and the count
    assert.equal(status, 200);
    assert.equal(body.result.values[0].text, 'first');
    assert.equal(body.result.values[0].note.title, `${sTag}-a`);
    assert.equal(body.result.count, 1);
  });

  test('Postgres errors answer 500 without their message, and a body off the table 400', async () => {
    // A comment nobody created: read, updated and deleted
    const sPath = '/comment/00000000-0000-0000-0000-000000000000';
    const oRead = await request(oServer.url, sPath);
    const oUpdate = await send('PUT', oServer.url, sPath, { text: 'edited' });
    const oDelete = await request(oServer.url, sPath, { method: 'DELETE' });

    // A comment of a note that does not exist, and a note without its title
    const oConflict = await send('POST', oServer.url, '/comment', { text: 'orphan', noteId: 0 });
    const oInvalid = await send('POST', oServer.url, '/note', { name: 'unknown field' });

    // Checks each status, and that the messages name no table or column
    const aStatuses = [oRead, oUpdate, oDelete, oConflict].map(oAnswer => oAnswer.status);
    assert.deepEqual(aStatuses, [404, 404, 404, 500]);
    assert.deepEqual(
      [oRead.body.message, oConflict.body.message],
      ['nano.error.notFound', 'nano.error.internal'],
    );

    // The schema of the table stops the note without its title before Postgres
    assert.equal(oInvalid.status, 400);
    assert.match(oInvalid.body.message, /^title: /);
  });
});
