import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { boot, request } from '../helpers';
import type { Booted } from '../helpers';

// Better Auth suite, imported by database.test.ts

const FIXTURES = 'tests/fixtures/auth';
const PLUGIN_ROUTES = 'tests/fixtures/plugin-routes';

/** The plugins around the app: one with a plain route, one with routes with permissions */
const PLUGINS = {
  before: [{ name: 'before', basePath: '/before', routesDir: PLUGIN_ROUTES }],
  after: [
    { name: 'after', basePath: '/after', routesDir: PLUGIN_ROUTES },
    { name: 'permissions', basePath: '/permissions', routesDir: `${FIXTURES}/permission-routes` },
  ],
};

/** The app with Better Auth and its rate limit: its secret signs the cookies */
const CONFIG = {
  plugins: PLUGINS,
  routesDir: `${FIXTURES}/routes`,
  authModule: resolve(`${FIXTURES}/options.ts`),
};
const ENV = { BETTER_AUTH_SECRET: 'a-secret-only-for-the-tests-of-nano-app' };

describe('Better Auth without DATABASE_URL', () => {
  test('fails the startup', async () => {
    // Boots with Better Auth and no DATABASE_URL
    const oApp = await boot(CONFIG, { ...ENV, DATABASE_URL: '' });

    // Checks that it exits saying why
    assert.equal(await oApp.exited, 1);
    assert.match(oApp.output(), /DATABASE_URL environment variable is not defined/);
  });
});

describe('without Better Auth', () => {
  test('a route with permissions answers without checking them', async () => {
    // Boots the same plugins without Better Auth
    const oApp = await boot({ plugins: PLUGINS });

    try {
      // Checks that it answers anyway
      const { status } = await request(oApp.url, '/permissions/notes');
      assert.equal(status, 200, oApp.output());
    } finally {
      oApp.child.kill('SIGKILL');
    }
  });
});

describe('Better Auth', { skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' }, () => {
  let oApp: Booted;
  let sCookie: string;

  before(async () => {
    // Boots with Better Auth: it creates its tables in nano_auth
    oApp = await boot(CONFIG, ENV);
    assert.match(oApp.output(), /READY/, oApp.output());
  });

  after(() => {
    oApp?.child.kill('SIGKILL');
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

  test('the plugins before and after the app need a session too', async () => {
    for (const sPath of ['/before/ping', '/after/ping']) {
      // Without a session
      const oDenied = await request(oApp.url, sPath);
      assert.equal(oDenied.status, 401);

      // With the session of the sign-in
      const oAllowed = await request(oApp.url, sPath, { headers: { cookie: sCookie } });
      assert.equal(oAllowed.status, 200);
    }
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
