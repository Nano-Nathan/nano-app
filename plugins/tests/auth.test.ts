import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import pg from 'pg';
import { request, startApp } from '../../backend/tests/helpers';
import auth from '../auth';
import health from '../health';

const ROUTES = 'tests/fixtures/routes';
const CLIENT_DIR = '.nano-app/prisma-clients/auth';

/**
 * Creates the table and the client of the plugin, as `nano-app push auth` does.
 * TODO: run `nano-app push auth` once the backend resolves the schemas of @nano-app/plugins
 */
function push(): void {
  // A copy of the schema whose client lands next to it
  mkdirSync(CLIENT_DIR, { recursive: true });
  writeFileSync(`${CLIENT_DIR}/schema.prisma`, readFileSync('auth/schema.prisma', 'utf-8'));

  // Generates the client and pushes the table
  const sPrisma = createRequire(import.meta.url).resolve('prisma/build/index.js');
  for (const aArgs of [['generate'], ['db', 'push', '--url', process.env.DATABASE_URL!]]) {
    execFileSync(process.execPath, [sPrisma, ...aArgs, '--schema', `${CLIENT_DIR}/schema.prisma`], {
      stdio: 'ignore',
    });
  }
}

describe(
  'auth',
  { concurrency: 1, skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' },
  () => {
    let oServer: Awaited<ReturnType<typeof startApp>>;
    let sMaster = '';
    let sKey = '';
    let sId = '';

    /** Request with a key, and a JSON body when there is one */
    const call = (
      sPath: string,
      { method = 'GET', key, body }: { method?: string; key?: string; body?: object } = {},
    ) =>
      request(oServer.url, sPath, {
        method,
        headers: { 'content-type': 'application/json', ...(key && { 'x-api-key': key }) },
        body: body && JSON.stringify(body),
      });

    before(async () => {
      // Starts from an empty schema, with the table pushed
      const oClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
      await oClient.connect();
      await oClient.query('DROP SCHEMA IF EXISTS nano_auth CASCADE');
      await oClient.end();
      rmSync(CLIENT_DIR, { recursive: true, force: true });
      push();
    });

    after(async () => {
      // Stops the server
      await oServer?.close();
    });

    test('the first startup creates the master key and prints it once', async () => {
      // Captures the console while the app starts
      const aWarnings: string[] = [];
      const fnWarn = console.warn;
      console.warn = (sMessage: string) => aWarnings.push(sMessage);
      try {
        oServer = await startApp([
          health(),
          auth({ publicPaths: ['/public'] }),
          { routesDir: ROUTES },
        ]);
      } finally {
        console.warn = fnWarn;
      }

      // The key is the last line of the only warning
      assert.equal(aWarnings.length, 1);
      assert.match(aWarnings[0], /master API key created/);
      sMaster = aWarnings[0].split('\n').pop()!;
    });

    test('routes before the plugin and publicPaths need no key', async () => {
      assert.equal((await call('/health')).status, 200);
      assert.equal((await call('/public')).status, 200);
    });

    test('the routes after the plugin need a valid key', async () => {
      // Without a key and with a wrong one
      assert.equal((await call('/private')).status, 401);
      assert.equal((await call('/private', { key: 'not-a-key' })).status, 401);

      // With the master key
      const { status, body } = await call('/private', { key: sMaster });
      assert.equal(status, 200, JSON.stringify(body));
    });

    test('the master creates a key, returned only once', async () => {
      // A key needs a name
      assert.equal(
        (await call('/api-keys', { method: 'POST', key: sMaster, body: {} })).status,
        400,
      );

      // Creates it
      const { status, body } = await call('/api-keys', {
        method: 'POST',
        key: sMaster,
        body: { name: 'n8n' },
      });
      assert.equal(status, 200, JSON.stringify(body));
      ({ id: sId, key: sKey } = body.result);

      // The list never returns the key nor its hash
      const { body: oList } = await call('/api-keys', { key: sMaster });
      assert.deepEqual(oList.result.map(({ name }: { name: string }) => name).sort(), [
        'master',
        'n8n',
      ]);
      assert.ok(oList.result.every((oKey: object) => !('key' in oKey) && !('hash' in oKey)));
    });

    test('any key reaches the routes; only the master manages the keys', async () => {
      assert.equal((await call('/private', { key: sKey })).status, 200);
      assert.equal((await call('/api-keys', { key: sKey })).status, 403);
    });

    test('renewing keeps the id and invalidates the old key', async () => {
      // Renews the key
      const { body } = await call(`/api-keys/${sId}/renew`, { method: 'POST', key: sMaster });
      assert.equal(body.result.id, sId);
      assert.equal((await call('/private', { key: sKey })).status, 401);
      sKey = body.result.key;
      assert.equal((await call('/private', { key: sKey })).status, 200);

      // Renews the master
      const { body: oMaster } = await call('/api-keys/master/renew', {
        method: 'POST',
        key: sMaster,
      });
      assert.equal((await call('/private', { key: sMaster })).status, 401);
      sMaster = oMaster.result.key;
      assert.equal((await call('/api-keys', { key: sMaster })).status, 200);
    });

    test('deletes a key, but never the master', async () => {
      // The master cannot be deleted
      const { body: oList } = await call('/api-keys', { key: sMaster });
      const sMasterId = oList.result.find((oKey: { isMaster: boolean }) => oKey.isMaster).id;
      const oDenied = await call(`/api-keys/${sMasterId}`, { method: 'DELETE', key: sMaster });
      assert.equal(oDenied.status, 403);

      // Another key can, and stops working
      assert.equal(
        (await call(`/api-keys/${sId}`, { method: 'DELETE', key: sMaster })).status,
        200,
      );
      assert.equal((await call('/private', { key: sKey })).status, 401);
      assert.equal(
        (await call(`/api-keys/${sId}`, { method: 'DELETE', key: sMaster })).status,
        404,
      );
    });
  },
);
