import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../../backend/src/database/Database';
import { prisma, request, startApp } from '../../backend/tests/helpers';
import crud from '../crud';
import type { NanoObject } from '@nano-app/backend';
import type { TestResponse } from '../../backend/tests/helpers';

const SCHEMA = '../backend/tests/fixtures/database/crud.prisma';

/** Sends a `QUERY` with its parameters as the JSON body */
function query(sUrl: string, sPath: string, oBody: NanoObject): Promise<TestResponse> {
  return request(sUrl, sPath, {
    method: 'QUERY',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oBody),
  });
}

describe('crud', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  const sTag = `crud-${Date.now()}`;
  let oServer: Awaited<ReturnType<typeof startApp>>;
  let sCommentId: string;

  before(async () => {
    // What the consumer does by hand: apply their schema
    prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

    // Mounts the app's database, then the plugin after it
    await Database.init();
    const oDb = await Database.mount('app', { enabled: true, schemaPath: SCHEMA });
    oServer = await startApp([crud()]);

    // Two notes of this run, the first with a comment
    const oNote = await oDb.note.create({
      data: { title: `${sTag}-a`, comments: { create: { text: 'first' } } },
      include: { comments: true },
    });
    await oDb.note.create({ data: { title: `${sTag}-b` } });
    sCommentId = oNote.comments[0].id;
  });

  after(async () => {
    // Deletes the notes of this run, their comments with them
    const oDb = Database.get('app');
    await oDb.note.deleteMany({ where: { title: { startsWith: sTag } } });
    await oDb.$disconnect();
    await oServer.close();
  });

  test('GET lists a model with its total', async () => {
    // Reads the notes without parameters
    const { status, body } = await request(oServer.url, '/api/note');

    // Checks the list and the total
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.result));
    assert.ok(body.count >= 2);
  });

  test('QUERY filters, orders, pages, selects and expands', async () => {
    // Reads the last note of this run with its comments
    const { body } = await query(oServer.url, '/api/note', {
      filter: { title: { startsWith: sTag } },
      orderby: { title: 'asc' },
      top: 1,
      skip: 0,
      select: 'title',
      expand: 'comments',
    });

    // Checks the page, the total of the filter and the fields
    assert.equal(body.count, 2);
    assert.deepEqual(Object.keys(body.result[0]), ['title', 'comments']);
    assert.equal(body.result[0].title, `${sTag}-a`);
    assert.equal(body.result[0].comments[0].text, 'first');
  });

  test('QUERY reads one record by its string id, with a nested relation', async () => {
    // Reads the comment with its note
    const { status, body } = await query(oServer.url, `/api/comment/${sCommentId}`, {
      expand: 'note',
    });

    // Checks the record and its relation
    assert.equal(status, 200);
    assert.equal(body.result.note.title, `${sTag}-a`);
  });

  test('a record that does not exist answers 404', async () => {
    // Reads a comment nobody created
    const { status } = await request(oServer.url, '/api/comment/missing');

    // Checks the status
    assert.equal(status, 404);
  });
});
