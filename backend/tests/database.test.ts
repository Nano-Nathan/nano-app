import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import pg from 'pg';
import { FileLoader } from '@nano-app/core';
import Database from '../src/database/Database';
import { boot, prisma, request } from './helpers';
import './database/better-auth';
import type { Booted } from './helpers';

const FIXTURES = 'tests/fixtures/database';
const SCHEMA = `${FIXTURES}/schema.prisma`;
const PLUGIN_SCHEMA = `${FIXTURES}/plugin.prisma`;
const MYSQL_SCHEMA = `${FIXTURES}/mysql.prisma`;
const OFFICIAL_SCHEMA = `${FIXTURES}/official/schema.prisma`;
const OFFICIAL_V2_SCHEMA = `${FIXTURES}/official-v2/schema.prisma`;

/** Generated clients (the generator `output` of each fixture schema) */
const CLIENT = `${FIXTURES}/generated/client/client.ts`;
const PLUGIN = `${FIXTURES}/generated/plugin/client.ts`;
const MYSQL = `${FIXTURES}/generated/mysql/client.ts`;

/** Every client lives in .nano-app/prisma-clients/<name>: removes it, so the mount generates it */
const fnResetClient = (sName: string) => {
  rmSync(`.nano-app/prisma-clients/${sName}`, { recursive: true, force: true });
};

// The generated clients are not versioned: the suite generates them (no database involved)
before(() => {
  for (const sName of ['schema', 'plugin', 'mysql']) {
    prisma('generate', '--schema', `${FIXTURES}/${sName}.prisma`);
  }
});

describe('client validation', () => {
  // The adapter connects lazily: a URL that answers nothing is enough to instantiate clients
  const sUrl = process.env.DATABASE_URL;
  before(async () => {
    process.env.DATABASE_URL = 'postgres://unused@127.0.0.1:1/unused';
    await Database.init();
  });
  after(() => {
    // Restores the real DATABASE_URL
    if (sUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = sUrl;
  });

  test('findPrismaClient validates the schema and loads the client class', async () => {
    // Checks that the generated client loads as a class
    assert.equal(typeof (await FileLoader.findPrismaClient(CLIENT, SCHEMA)), 'function');
  });

  test('findPrismaClient fails when the client module cannot be loaded', async () => {
    // A directory instead of the module
    await assert.rejects(
      FileLoader.findPrismaClient(`${FIXTURES}/generated/client`, SCHEMA),
      /could not be loaded/,
    );

    // A module that does not exist
    await assert.rejects(
      FileLoader.findPrismaClient(`${FIXTURES}/missing/client.ts`, SCHEMA),
      /could not be loaded.*not found/,
    );
  });

  test('the schema must be PostgreSQL; declaring schemas is optional', async () => {
    // Checks that MySQL is rejected
    await assert.rejects(
      FileLoader.findPrismaClient(MYSQL, MYSQL_SCHEMA),
      /not a valid Prisma schema/,
    );

    // Checks that a schema without `schemas` is accepted
    assert.equal(
      typeof (await FileLoader.findPrismaClient(CLIENT, `${FIXTURES}/no-schemas.prisma`)),
      'function',
    );
  });

  test('a commented-out nano_* schema does not count', async () => {
    // Checks the validation
    assert.equal(
      typeof (await FileLoader.findPrismaClient(CLIENT, `${FIXTURES}/commented.prisma`)),
      'function',
    );

    // Checks the mount
    fnResetClient('commented');
    assert.ok(await Database.mount('commented', { schemaPath: `${FIXTURES}/commented.prisma` }));
  });

  test('mount rejects a schema for another provider', async () => {
    // A MySQL schema, generated at mount
    fnResetClient('mysql');

    // Checks that the schema is rejected
    await assert.rejects(
      Database.mount('mysql', { schemaPath: MYSQL_SCHEMA }),
      /mysql.prisma is not a valid Prisma schema/,
    );
  });

  test('mount fails when the schema does not exist', async () => {
    // Checks that mounting a missing schema fails naming it
    await assert.rejects(
      Database.mount('missing', { schemaPath: `${FIXTURES}/missing.prisma` }),
      /missing.prisma not found/,
    );
  });

  test('nano_* schemas are reserved for the plugins in plugins/', async () => {
    // A consumer database whose schema declares nano_*
    fnResetClient('reserved');
    await assert.rejects(
      Database.mount('reserved', { schemaPath: PLUGIN_SCHEMA }),
      /the nano_\* schemas are reserved for plugins/,
    );
  });
});

describe('startup without a database', () => {
  test('the startup generates the client and fails when its tables cannot be read', async () => {
    // Boots with the database enabled, no client and a database that answers nothing
    fnResetClient('app');
    const oApp = await boot(
      { mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } },
      { oEnv: { DATABASE_URL: 'postgres://unused@127.0.0.1:1/unused' } },
    );

    // Checks that it generated the client, then stopped at the tables with what to do
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /Prisma client "app" generated/);
    assert.match(
      oApp.output(),
      /The database "app" is not ready: .* Apply your schema with Prisma/,
    );
    assert.ok(existsSync('.nano-app/prisma-clients/app/generated/client.ts'));
  });

  test('a database without DATABASE_URL fails the startup', async () => {
    // Boots with a client but no DATABASE_URL
    fnResetClient('app');
    const oApp = await boot(
      { mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } },
      { oEnv: { DATABASE_URL: '' } },
    );

    // Checks that it exits saying why
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /DATABASE_URL environment variable is not defined/);
  });

  test('a consumer schema declaring a nano_* schema fails the startup', async () => {
    // Boots the consumer with a schema that declares nano_*
    fnResetClient('app');
    const oDatabase = { enabled: true, schemaPath: PLUGIN_SCHEMA };
    const oApp = await boot(
      { mainPlugin: { database: oDatabase } },
      { oEnv: { DATABASE_URL: 'postgres://unused@localhost/unused' } },
    );

    // Checks that it exits
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /the nano_\* schemas are reserved for plugins/);
  });

  test('a disabled database is not mounted and the handlers receive no client', async () => {
    // Boots with the database disabled
    const oDatabase = { enabled: false, schemaPath: SCHEMA };
    const oApp = await boot(
      { mainPlugin: { routesDir: `${FIXTURES}/routes`, database: oDatabase } },
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

  test('an app without a database neither loads nor needs Prisma', async () => {
    // Boots with the Prisma stack unresolvable
    const oApp = await boot({}, { isBlockPrisma: true });

    // Checks that the app answers
    const { status } = await request(oApp.url, '/health');
    assert.equal(status, 200, oApp.output());

    // Checks that nothing tried to load Prisma
    oApp.child.kill('SIGTERM');
    await oApp.exited;
    assert.doesNotMatch(oApp.output(), /BLOCKED/);
  });
});

describe('PostgreSQL', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  let oApp: Booted;

  before(async () => {
    // What the consumer does by hand: apply their schema
    prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

    // Boots with the database enabled
    fnResetClient('app');
    oApp = await boot({
      mainPlugin: {
        routesDir: `${FIXTURES}/routes`,
        database: { enabled: true, schemaPath: SCHEMA },
      },
    });

    // Checks that it started with the client mounted
    assert.match(oApp.output(), /READY/, oApp.output());
    assert.match(oApp.output(), /Database "app" mounted/);
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
  });

  test("an official plugin's migrations are applied at mount, once", async () => {
    // Starts from a database without the plugin's schema
    const oClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await oClient.connect();
    await oClient.query('DROP SCHEMA IF EXISTS "nano_test" CASCADE');

    // Mounts it: the migrations create its tables and its own history
    fnResetClient('official');
    await Database.init();
    const oDb = await Database.mount('official', { schemaPath: OFFICIAL_SCHEMA });
    assert.equal(await oDb.item.count(), 0);
    const { rows } = await oClient.query(
      'SELECT migration_name FROM "nano_test"."_prisma_migrations" WHERE finished_at IS NOT NULL',
    );
    assert.deepEqual(rows, [{ migration_name: '0001_init' }]);

    // Mounting it again applies nothing new
    await Database.mount('official-again', { schemaPath: OFFICIAL_SCHEMA });
    const { rowCount } = await oClient.query('SELECT 1 FROM "nano_test"."_prisma_migrations"');
    assert.equal(rowCount, 1);
    await oClient.end();
  });

  test("an official plugin's next version applies only its new migrations", async () => {
    // Starts from the first version of the plugin, already migrated
    const oClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await oClient.connect();
    await oClient.query('DROP SCHEMA IF EXISTS "nano_test" CASCADE');
    fnResetClient('official-v1');
    await Database.init();
    const oV1 = await Database.mount('official-v1', { schemaPath: OFFICIAL_SCHEMA });
    await oV1.item.create({ data: { id: 1 } });

    // Mounts the next version: only its new migration runs, the data stays
    fnResetClient('official-v2');
    const oV2 = await Database.mount('official-v2', { schemaPath: OFFICIAL_V2_SCHEMA });
    const { rows } = await oClient.query(
      'SELECT migration_name FROM "nano_test"."_prisma_migrations" ORDER BY migration_name',
    );
    assert.deepEqual(rows, [{ migration_name: '0001_init' }, { migration_name: '0002_add_name' }]);
    assert.deepEqual(await oV2.item.findMany(), [{ id: 1, name: '' }]);
    await oClient.end();
  });

  test('a missing column of the consumer fails the mount', async () => {
    // The consumer's schema applied, then a column dropped by hand
    prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);
    const oClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await oClient.connect();
    await oClient.query('TRUNCATE "app_data"."notes"');
    await oClient.query('ALTER TABLE "app_data"."notes" DROP COLUMN "title"');
    await oClient.end();

    // Checks that the mount names the column
    fnResetClient('drifted');
    await Database.init();
    await assert.rejects(
      Database.mount('drifted', { schemaPath: SCHEMA }),
      /The database "drifted" is not ready: .*notes.title/,
    );

    // Restores the consumer's schema for the other tests
    prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);
  });

  test("the consumer's routes receive its client", async () => {
    // Checks that the route got the client
    const { body } = await request(oApp.url, '/has-db');
    assert.equal(body.result, true);
  });

  test("a consumer route receives the consumer's client and answers an ApiResponse", async () => {
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
