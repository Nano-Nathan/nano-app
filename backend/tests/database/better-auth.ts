import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { boot, push, request } from '../helpers';
import * as authSchema from '../fixtures/auth/schema';
import type { Booted } from '../helpers';

// Better Auth suite, imported by database.test.ts: the app runs from the auth fixture

const FIXTURES = resolve('tests/fixtures/auth');
const SCHEMA = `${FIXTURES}/schema.ts`;
const NO_AUTH_SCHEMA = resolve('tests/fixtures/database/schema.ts');
const PLUGIN_ROUTES = resolve('tests/fixtures/plugin-routes');

/** Env of the instance: Better Auth signs its cookies with the secret */
const ENV = { BETTER_AUTH_SECRET: 'a-secret-only-for-the-tests-of-nano-app' };

/** Boots the app with Better Auth and its rate limit on the Drizzle schema of a module */
const fnBoot = (sSchemaModule: string) =>
  boot(
    {
      plugins: [
        { name: 'public', routesDir: PLUGIN_ROUTES },
        { name: 'early', basePath: '/early', routesDir: `${FIXTURES}/permission-routes` },
        {
          name: 'after',
          stage: 'after',
          basePath: '/after',
          routesDir: PLUGIN_ROUTES,
        },
        {
          name: 'permissions',
          stage: 'after',
          basePath: '/permissions',
          routesDir: `${FIXTURES}/permission-routes`,
        },
      ],
      routesDir: `${FIXTURES}/routes`,
      schemaModule: sSchemaModule,
    },
    { oEnv: ENV, sCwd: FIXTURES },
  );

describe('Better Auth without options', () => {
  test('fails the startup naming the file', async () => {
    // Boots from an app whose src/auth.ts has no options
    const oApp = await boot({}, { oEnv: ENV, sCwd: resolve('tests/fixtures/bad-auth') });

    // Checks that it exits saying what the file must export
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /src\/auth.ts must default export \{ options \}/);
  });
});

describe('Better Auth without a database', () => {
  test('fails the startup', async () => {
    // Boots with Better Auth and the database off
    const oApp = await boot({}, { oEnv: ENV, sCwd: FIXTURES });

    // Checks that it exits saying what to enable
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /src\/auth.ts needs the database of the app/);
  });
});

describe('Better Auth', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  let oApp: Booted;
  let sCookie: string;

  before(async () => {
    // What the consumer does by hand: apply the schema with the tables of Better Auth
    await push(authSchema, ['auth_test']);

    // Boots with Better Auth on the app's database
    oApp = await fnBoot(SCHEMA);
    assert.match(oApp.output(), /READY/, oApp.output());
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
  });

  test('a schema without its tables fails the startup with the command that adds them', async () => {
    // Boots with a schema that has no Better Auth tables
    const oFailed = await fnBoot(NO_AUTH_SCHEMA);

    // Checks that it exits naming the tables and the fix
    assert.equal(await oFailed.exited, 1);
    assert.match(oFailed.output(), /needs the tables user, session, account, verification/);
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

    // A public route answers without checking them
    const oPublic = await request(oApp.url, '/permissions/open');
    assert.equal(oPublic.status, 200);

    // Permissions of a method win over those of the route: it cannot read notes, but lists users
    const oListed = await request(oApp.url, '/permissions/methods', {
      headers: { cookie: sCookie },
    });
    const oCreated = await request(oApp.url, '/permissions/methods', {
      method: 'POST',
      headers: { cookie: sCookie },
    });
    assert.deepEqual([oListed.status, oCreated.status], [403, 200]);
  });

  test('without Better Auth, a route with permissions answers and warns at startup', async () => {
    // The plugin mounted before the app has no Better Auth: it answers anyway
    const { status } = await request(oApp.url, '/early/notes');
    assert.equal(status, 200);

    // It warned at startup that the permissions are not checked
    assert.match(
      oApp.output(),
      /\/early\/notes: its permissions are not checked without Better Auth/,
    );
  });

  test('sign-in is limited per client behind private proxies', async () => {
    // Signs in with a wrong password from a client: a forged IP, then the one its proxy appended
    const fnSignIn = (sForwardedFor: string) =>
      request(oApp.url, '/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: oApp.url,
          'x-forwarded-for': sForwardedFor,
        },
        body: JSON.stringify({ email: 'nobody@nano-app.test', password: 'a-wrong-password' }),
      });

    // Uses up the three attempts of one client: the fourth gets 429
    for (const _iTry of [1, 2, 3]) await fnSignIn('198.51.100.1, 203.0.113.1');
    const oLimited = await fnSignIn('198.51.100.1, 203.0.113.1');
    assert.equal(oLimited.status, 429);

    // Another client with the same forged IP keeps its own count
    const oOther = await fnSignIn('198.51.100.1, 203.0.113.2');
    assert.notEqual(oOther.status, 429);
  });
});
