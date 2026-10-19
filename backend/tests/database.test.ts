import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { FileLoader } from '@nano-app/core';
import Database from '../src/database/Database';
import { boot, request, type Booted } from './helpers';

const FIXTURES = 'tests/fixtures/database';
const SCHEMA = `${FIXTURES}/schema.prisma`;
const PLUGIN_SCHEMA = `${FIXTURES}/plugin.prisma`;
const MYSQL_SCHEMA = `${FIXTURES}/mysql.prisma`;
const OFFICIAL_SCHEMA = `${FIXTURES}/official/schema.prisma`;

/** Generated clients (the generator `output` of each fixture schema) */
const CLIENT = `${FIXTURES}/generated/client/client.ts`;
const PLUGIN = `${FIXTURES}/generated/plugin/client.ts`;
const MYSQL = `${FIXTURES}/generated/mysql/client.ts`;

/** Runs the Prisma CLI of the backend's dev dependencies */
const fnPrisma = (...aArgs: string[]) =>
  execFileSync(
    process.execPath,
    [createRequire(import.meta.url).resolve('prisma/build/index.js'), ...aArgs],
    { stdio: 'ignore' },
  );

/** Every client lives in .nano-app/prisma-clients/<name>: puts a fixture client there, or none */
const fnUseClient = (sName: string, sFixture?: string) => {
  // Removes the current client
  const sDir = `.nano-app/prisma-clients/${sName}/generated`;
  rmSync(sDir, { recursive: true, force: true });

  // Copies the fixture's, when given
  if (sFixture) cpSync(`${FIXTURES}/generated/${sFixture}`, sDir, { recursive: true });
};

// The generated clients are not versioned: the suite generates them (no database involved)
before(() => {
  for (const sName of ['schema', 'plugin', 'mysql']) {
    fnPrisma('generate', '--schema', `${FIXTURES}/${sName}.prisma`);
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
    fnUseClient('commented', 'client');
    assert.ok(await Database.mount('commented', { schemaPath: `${FIXTURES}/commented.prisma` }));
  });

  test('mount rejects a module that is not a Prisma client, and a client for another provider', async () => {
    // A client module that exports no PrismaClient
    fnUseClient('route');
    mkdirSync('.nano-app/prisma-clients/route/generated', { recursive: true });
    writeFileSync(
      '.nano-app/prisma-clients/route/generated/client.ts',
      'export const notAClient = true;\n',
    );

    // A client generated for MySQL
    fnUseClient('mysql', 'mysql');

    // Checks that both fail to instantiate
    await assert.rejects(
      Database.mount('route', { schemaPath: SCHEMA }),
      /Cannot instantiate the database "route"/,
    );
    await assert.rejects(
      Database.mount('mysql', { schemaPath: SCHEMA }),
      /Cannot instantiate the database "mysql".*mysql/,
    );
  });

  test('nano_* schemas are reserved for the plugins in plugins/', async () => {
    // A consumer database whose schema declares nano_*
    fnUseClient('reserved', 'plugin');
    await assert.rejects(
      Database.mount('reserved', { schemaPath: PLUGIN_SCHEMA }),
      /the nano_\* schemas are reserved for plugins/,
    );
  });

  test('a schema of @nano-app/plugins may declare nano_* and needs its tables pushed', async () => {
    // An official plugin's schema, with no table behind it
    fnUseClient('official', 'plugin');

    // Checks that it passes the nano_* rule and stops at the missing table
    await assert.rejects(
      Database.mount('official', { schemaPath: OFFICIAL_SCHEMA }),
      /The database "official" is not ready: .* Run `npx nano-app push official`/,
    );
  });
});

describe('startup without a database', () => {
  test('an enabled database whose client cannot be loaded fails the startup', async () => {
    // Boots with the database enabled and no client
    fnUseClient('app');
    const oApp = await boot(
      { mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } },
      { env: { DATABASE_URL: 'postgres://unused@localhost/unused' } },
    );

    // Checks that it exits with the command to run
    assert.equal(await oApp.exited, 1);
    assert.match(
      oApp.output(),
      /prisma client of "app" does not exist. Run `npx nano-app generate app`/,
    );
  });

  test('a database without DATABASE_URL fails the startup', async () => {
    // Boots with a client but no DATABASE_URL
    fnUseClient('app', 'client');
    const oApp = await boot(
      { mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } },
      { env: { DATABASE_URL: '' } },
    );

    // Checks that it exits saying why
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /DATABASE_URL environment variable is not defined/);
  });

  test('a consumer schema declaring a nano_* schema fails the startup', async () => {
    // Boots the consumer with a schema that declares nano_*
    fnUseClient('app', 'plugin');
    const oDatabase = { enabled: true, schemaPath: PLUGIN_SCHEMA };
    const oApp = await boot(
      { mainPlugin: { database: oDatabase } },
      { env: { DATABASE_URL: 'postgres://unused@localhost/unused' } },
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
      { env: { DATABASE_URL: '' } },
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
    const oApp = await boot({}, { blockPrisma: true });

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
    fnPrisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

    // Boots with the database enabled
    fnUseClient('app', 'client');
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

  test("an official plugin's client mounts once its tables are pushed", async () => {
    // What the consumer does with `nano-app push`: apply the plugin's schema
    fnPrisma('db', 'push', '--schema', OFFICIAL_SCHEMA, '--url', process.env.DATABASE_URL!);

    // Mounts it on the real database
    fnUseClient('pushed', 'plugin');
    await Database.init();
    const oClient = await Database.mount('pushed', { schemaPath: OFFICIAL_SCHEMA });

    // Checks that its tables answer
    assert.equal(await oClient.item.count(), 0);
  });

  test("the consumer's routes receive its client", async () => {
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
