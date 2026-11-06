import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { boot, prisma, request } from '../helpers';
import { AUTH_OPTIONS } from '../fixtures/auth/auth';
import type { Booted } from '../helpers';

// Better Auth suite, imported by database.test.ts: both boot the "app" client in
// .nano-app/prisma-clients/app, one after the other in one process

const FIXTURES = 'tests/fixtures/auth';
const SCHEMA = `${FIXTURES}/schema.prisma`;
const NO_AUTH_SCHEMA = 'tests/fixtures/database/schema.prisma';

/** Env of the instance: Better Auth signs its cookies with the secret */
const ENV = { BETTER_AUTH_SECRET: 'a-secret-only-for-the-tests-of-nano-app' };

/** Boots the app with Better Auth on a schema, after removing its client */
const fnBoot = (sSchemaPath: string) => {
  rmSync('.nano-app/prisma-clients/app', { recursive: true, force: true });
  return boot(
    {
      packages: { betterAuth: AUTH_OPTIONS },
      plugins: [
        { name: 'public', routesDir: 'tests/fixtures/plugin-routes' },
        { name: 'early', basePath: '/early', routesDir: `${FIXTURES}/permission-routes` },
        {
          name: 'after',
          stage: 'after',
          basePath: '/after',
          routesDir: 'tests/fixtures/plugin-routes',
        },
        {
          name: 'permissions',
          stage: 'after',
          basePath: '/permissions',
          routesDir: `${FIXTURES}/permission-routes`,
        },
      ],
      mainPlugin: {
        routesDir: `${FIXTURES}/routes`,
        database: { enabled: true, schemaPath: sSchemaPath },
      },
    },
    { oEnv: ENV },
  );
};

describe('Better Auth without a database', () => {
  test('fails the startup', async () => {
    // Boots with Better Auth and the database off
    const oApp = await boot({ packages: { betterAuth: AUTH_OPTIONS } }, { oEnv: ENV });

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
    prisma('db', 'push', '--schema', SCHEMA, '--url', process.env.DATABASE_URL!);

    // Boots with Better Auth on the app's database
    oApp = await fnBoot(SCHEMA);
    assert.match(oApp.output(), /READY/, oApp.output());
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
  });

  test('a schema without its models fails the startup with the command that adds them', async () => {
    // Boots with a schema that has no Better Auth models
    prisma('db', 'push', '--schema', NO_AUTH_SCHEMA, '--url', process.env.DATABASE_URL!);
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
    // Checks that the plugin answers without a session
    const { status } = await request(oApp.url, '/ping');
    assert.equal(status, 200);
  });

  test('a public route answers without a session, and receives it when there is one', async () => {
    // Without a session
    const oAnonymous = await request(oApp.url, '/open');
    assert.equal(oAnonymous.status, 200);
    assert.equal(oAnonymous.body.result, null);

    // With the session of the sign-in
    const oSigned = await request(oApp.url, '/open', { headers: { cookie: sCookie } });
    assert.equal(oSigned.status, 200);
    assert.match(oSigned.body.result, /@nano-app\.test$/);
  });

  test('the plugins mounted after the app need a session', async () => {
    // Without a session
    const oDenied = await request(oApp.url, '/after/ping');
    assert.equal(oDenied.status, 401);

    // With the session of the sign-in
    const oAllowed = await request(oApp.url, '/after/ping', { headers: { cookie: sCookie } });
    assert.equal(oAllowed.status, 200);
  });

  test('an unknown path answers 404 without a session', async () => {
    const { status } = await request(oApp.url, '/nowhere');
    assert.equal(status, 404);
  });

  test('a route whose public is not a boolean is discarded', async () => {
    // Checks the warning and that it is not mounted
    assert.match(oApp.output(), /"public" must be a boolean/);
    const { status } = await request(oApp.url, '/bad-public', { headers: { cookie: sCookie } });
    assert.equal(status, 404);
  });

  test('a route with permissions needs them', async () => {
    // Without a session it still answers 401
    const oNoSession = await request(oApp.url, '/permissions/notes');
    assert.equal(oNoSession.status, 401);

    // The role of the user, admin, has no permission on notes
    const oDenied = await request(oApp.url, '/permissions/notes', { headers: { cookie: sCookie } });
    assert.equal(oDenied.status, 403);

    // It has the permission to list users
    const oGranted = await request(oApp.url, '/permissions/users', {
      headers: { cookie: sCookie },
    });
    assert.equal(oGranted.status, 200);
  });

  test('without Better Auth, a route with permissions answers and warns at startup', async () => {
    // The plugin mounted before the app has no Better Auth
    const { status } = await request(oApp.url, '/early/notes');
    assert.equal(status, 200);
    assert.match(oApp.output(), /asks for permissions without Better Auth/);
  });
});
