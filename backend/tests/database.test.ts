import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import DatabaseManager from '../src/database/DatabaseManager';
import Drizzle from '../src/database/clients/Drizzle';
import { boot, push, request } from './helpers';
import * as schema from './fixtures/database/schema';
import { relations } from './fixtures/database/reserved';
import './database/better-auth';
import type { Booted } from './helpers';

const FIXTURES = 'tests/fixtures/database';
const SCHEMA_MODULE = resolve(`${FIXTURES}/schema.ts`);

describe('database', () => {
  test('a nano_* schema is reserved for the plugin of its name', async () => {
    // The app, and a plugin of another name, with a table in nano_test
    for (const sName of ['app', 'other']) {
      await assert.rejects(
        DatabaseManager.mount(new Drizzle(sName, { relations: relations })),
        /"nano_test.items" breaks the rule, each nano_\* schema is reserved/,
      );
    }
  });

  test('a database without DATABASE_URL fails the startup', async () => {
    // Boots with a schema but no DATABASE_URL
    const oApp = await boot({ schemaModule: SCHEMA_MODULE }, { DATABASE_URL: '' });

    // Checks that it exits saying why
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /DATABASE_URL environment variable is not defined/);
  });

  test('an app without a database mounts none and its handlers receive no client', async () => {
    // Boots without a schema nor DATABASE_URL
    const oApp = await boot({ routesDir: `${FIXTURES}/routes` }, { DATABASE_URL: '' });

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
    oApp = await boot({ routesDir: `${FIXTURES}/routes`, schemaModule: SCHEMA_MODULE });

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

describe('migrations', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  test('the pending migrations of its folder are applied at startup', async () => {
    // Starts without the tables of the app nor Drizzle's record of its migrations
    await push({}, ['app_data', 'drizzle']);

    // Boots with the folder `drizzle-kit generate` wrote
    const oApp = await boot({
      routesDir: `${FIXTURES}/routes`,
      schemaModule: SCHEMA_MODULE,
      database: { migrate: `${FIXTURES}/migrations` },
    });

    try {
      // Checks that the table of the migration answers
      const { status, body } = await request(oApp.url, '/notes');
      assert.equal(status, 200, oApp.output());
      assert.deepEqual(body.result, []);
    } finally {
      oApp.child.kill('SIGKILL');
    }
  });
});
