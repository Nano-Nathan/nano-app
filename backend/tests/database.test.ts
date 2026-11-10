import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import Database from '../src/database/Database';
import { boot, push, request } from './helpers';
import * as schema from './fixtures/database/schema';
import * as reserved from './fixtures/database/reserved';
import './database/better-auth';
import type { Booted } from './helpers';

const FIXTURES = 'tests/fixtures/database';
const SCHEMA_MODULE = resolve(`${FIXTURES}/schema.ts`);

describe('database', () => {
  test('the app never keeps tables in nano_*, a plugin only in nano_<its name>', async () => {
    // The app, and a plugin of another name, with a table in nano_test
    await assert.rejects(
      Database.mount('app', { schema: reserved }),
      /"nano_test.items".*the nano_\* schemas are reserved for plugins/,
    );
    await assert.rejects(
      Database.mount('other', { schema: reserved }),
      /"nano_test.items".*keeps its tables in "nano_other"/,
    );
  });

  test('a database without DATABASE_URL fails the startup', async () => {
    // Boots with a schema but no DATABASE_URL
    const oApp = await boot({ schemaModule: SCHEMA_MODULE }, { oEnv: { DATABASE_URL: '' } });

    // Checks that it exits saying why
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /DATABASE_URL environment variable is not defined/);
  });

  test('an app without a database mounts none and its handlers receive no client', async () => {
    // Boots without a schema nor DATABASE_URL
    const oApp = await boot(
      { mainPlugin: { routesDir: `${FIXTURES}/routes` } },
      { oEnv: { DATABASE_URL: '' } },
    );

    try {
      // Checks that the handler got no client and nothing was mounted
      const { body } = await request(oApp.url, '/has-db');
      assert.equal(body.result, false, oApp.output());
      assert.doesNotMatch(oApp.output(), /Database "app" mounted/);
    } finally {
      oApp.child.kill('SIGKILL');
    }
  });
});

describe('PostgreSQL', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  let oApp: Booted;

  before(async () => {
    // What the consumer does by hand: apply their schema
    await push(schema, ['app_data']);

    // Boots with the app's schema
    oApp = await boot({
      mainPlugin: { routesDir: `${FIXTURES}/routes` },
      schemaModule: SCHEMA_MODULE,
    });

    // Checks that it started with the client mounted
    assert.match(oApp.output(), /READY/, oApp.output());
    assert.match(oApp.output(), /Database "app" mounted/);
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
  });

  test("the app's routes receive its client", async () => {
    // Checks that the route got the client
    const { body } = await request(oApp.url, '/has-db');
    assert.equal(body.result, true);
  });

  test("an app route reads and writes through the app's client and answers an ApiResponse", async () => {
    // Creates a note through the route
    const sTitle = `note-${Date.now()}`;
    const oCreated = await request(oApp.url, '/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: sTitle }),
    });
    assert.equal(oCreated.status, 200);
    assert.equal(oCreated.body.result.title, sTitle);

    // Checks that the list has it
    const oListed = await request(oApp.url, '/notes');
    assert.equal(oListed.status, 200);
    assert.ok(oListed.body.result.some((oNote: { title: string }) => oNote.title === sTitle));
  });
});
