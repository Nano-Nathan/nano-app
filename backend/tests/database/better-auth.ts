import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { boot, request, type Booted } from '../helpers';
import { AUTH_OPTIONS } from '../fixtures/auth/auth';

/**
 * Better Auth suite. Imported by database.test.ts, not a test file of its own: both boot the
 * "app" client in .nano-app/prisma-clients/app, so they run one after the other in one process
 */

const FIXTURES = 'tests/fixtures/auth';
const SCHEMA = `${FIXTURES}/schema.prisma`;
const NO_AUTH_SCHEMA = 'tests/fixtures/database/schema.prisma';

/** Env of the instance: Better Auth signs its cookies with the secret */
const ENV = { BETTER_AUTH_SECRET: 'a-secret-only-for-the-tests-of-nano-app' };

/** Runs the Prisma CLI of the backend's dev dependencies */
const fnPrisma = (...aArgs: string[]) =>
  execFileSync(
    process.execPath,
    [createRequire(import.meta.url).resolve('prisma/build/index.js'), ...aArgs],
    { stdio: 'ignore' },
  );

/** Boots the app with Better Auth on a schema, after removing its client */
const fnBoot = (sSchemaPath: string) => {
  rmSync('.nano-app/prisma-clients/app', { recursive: true, force: true });
  return boot(
    {
      packages: { betterAuth: AUTH_OPTIONS },
      plugins: [{ name: 'public', routesDir: 'tests/fixtures/plugin-routes' }],
      mainPlugin: {
        routesDir: `${FIXTURES}/routes`,
        database: { enabled: true, schemaPath: sSchemaPath },
      },
    },
    { env: ENV },
  );
};

describe('Better Auth without a database', () => {
  test('fails the startup', async () => {
    // Boots with Better Auth and the database off
    const oApp = await boot({ packages: { betterAuth: AUTH_OPTIONS } }, { env: ENV });

    // Checks that it exits saying what to enable
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /packages.betterAuth needs the database of the app/);
  });
});

describe('Better Auth', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  let oApp: Booted;
  let sCookie: string;

  before(async () => {
    // What the consumer does by hand: apply the schema with the models of Better Auth
    fnPrisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

    // Boots with Better Auth on the app's database
    oApp = await fnBoot(SCHEMA);
    assert.match(oApp.output(), /READY/, oApp.output());
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
  });

  test('a schema without its models fails the startup with the command that adds them', async () => {
    // Boots with a schema that has no Better Auth models
    fnPrisma('db', 'push', '--schema', NO_AUTH_SCHEMA, '--url', process.env.DATABASE_URL!);
    const oFailed = await fnBoot(NO_AUTH_SCHEMA);

    // Checks that it exits naming the models and the fix
    assert.equal(await oFailed.exited, 1);
    assert.match(oFailed.output(), /needs the models user, session, account, verification/);
    assert.match(oFailed.output(), /npx auth generate/);
  });

  test('its endpoints are public: signs up and signs in', async () => {
    // A browser sends its origin: Better Auth rejects a POST without it
    const oInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: oApp.url },
    };
    const oCredentials = { email: `user-${Date.now()}@nano-app.test`, password: 'a-long-password' };

    // Signs up a user
    const oSignUp = await request(oApp.url, '/api/auth/sign-up/email', {
      ...oInit,
      body: JSON.stringify({ ...oCredentials, name: 'User' }),
    });
    assert.equal(oSignUp.status, 200, JSON.stringify(oSignUp.body));

    // Signs in and keeps the session cookie
    const oSignIn = await request(oApp.url, '/api/auth/sign-in/email', {
      ...oInit,
      body: JSON.stringify(oCredentials),
    });
    assert.equal(oSignIn.status, 200);
    sCookie = oSignIn.headers.get('set-cookie')!.split(';')[0];
  });

  test('the routes of the app need a session, and their handlers receive it', async () => {
    // Without a session
    const oDenied = await request(oApp.url, '/me');
    assert.equal(oDenied.status, 401);
    assert.equal(oDenied.body.message, 'Not authenticated');

    // With the session of the sign-in
    const oAllowed = await request(oApp.url, '/me', { headers: { cookie: sCookie } });
    assert.equal(oAllowed.status, 200);
    assert.match(oAllowed.body.result, /@nano-app\.test$/);
  });

  test('the plugins mounted before the app stay public', async () => {
    const { status } = await request(oApp.url, '/ping');
    assert.equal(status, 200);
  });
});
