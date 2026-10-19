import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startApp, request } from '../../backend/tests/helpers';
import health from '../health';
import auth from '../auth';
import { DEFAULT_ADMIN_PASSWORD } from '../auth/admin';
import { migrate, SCHEMA } from '../auth/migrate';

const ROUTES = 'tests/fixtures/routes';

describe(
  'auth',
  { concurrency: 1, skip: !process.env.DATABASE_URL && 'DATABASE_URL is not set' },
  () => {
    process.env.BETTER_AUTH_SECRET ??= 'nano-app-tests-secret-with-enough-entropy-0123456789';

    const oPlugin = auth({ publicPaths: ['/public'] });
    const oAuth = oPlugin.options!.auth;
    let oServer: Awaited<ReturnType<typeof startApp>>;
    let sCookie = '';

    /** JSON request as a browser sends it: same origin, the session cookie when there is one */
    const call = (
      sPath: string,
      { body, cookie, apiKey }: { body?: object; cookie?: string; apiKey?: string } = {},
    ) =>
      request(oServer.url, sPath, {
        method: body ? 'POST' : 'GET',
        headers: {
          origin: oServer.url,
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(cookie ? { cookie } : {}),
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

    /** `name=value` pairs of every Set-Cookie, ready for a Cookie header */
    const cookieOf = (oHeaders: Headers) =>
      oHeaders
        .getSetCookie()
        .map(sCookie => sCookie.split(';')[0])
        .join('; ');

    before(async () => {
      // Starts from an empty schema
      const oClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
      await oClient.connect();
      await oClient.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
      await oClient.end();
    });

    after(async () => {
      // Stops the server and closes the pool
      await oServer?.close();
      await (oAuth.options.database as unknown as pg.Pool).end();
    });

    test('the startup fails until the tables are migrated', async () => {
      await assert.rejects(
        startApp([oPlugin]),
        /nano_auth" schema does not exist.*nano-app-auth migrate/,
      );
    });

    test('migrate creates the schema and the tables, and a second run changes nothing', async () => {
      // Creates everything
      const aChanges = await migrate(oAuth);
      assert.ok(aChanges.includes(`created ${SCHEMA}.user`), aChanges.join('\n'));

      // Nothing left to do
      assert.deepEqual(await migrate(oAuth), []);
    });

    test('starts, creating the admin user', async () => {
      oServer = await startApp([health(), oPlugin, { routesDir: ROUTES }]);
    });

    test('plugins listed before auth and publicPaths skip the guard', async () => {
      assert.equal((await call('/health')).status, 200);
      assert.equal((await call('/public')).status, 200);
    });

    test('a route behind the guard rejects a request without a session', async () => {
      const { status, body } = await call('/private');
      assert.equal(status, 401);
      assert.equal(body.success, false);
    });

    test('sign-up is closed', async () => {
      const { status } = await call('/auth/sign-up/email', {
        body: { email: 'someone@example.com', password: 'password123', name: 'someone' },
      });
      assert.notEqual(status, 200);
    });

    test('with the default password the admin can only change it', async () => {
      // Signs in with the default password
      const oSignIn = await call('/auth/sign-in/username', {
        body: { username: 'admin', password: DEFAULT_ADMIN_PASSWORD },
      });
      assert.equal(oSignIn.status, 200, JSON.stringify(oSignIn.body));
      assert.equal(oSignIn.body.user.mustChangePassword, true);
      sCookie = cookieOf(oSignIn.headers);

      // The routes behind the guard answer 403
      const { status, body } = await call('/private', { cookie: sCookie });
      assert.equal(status, 403);
      assert.match(body.message, /change-password/);

      // And so do the Better Auth endpoints
      assert.equal((await call('/auth/admin/list-users', { cookie: sCookie })).status, 403);
      const oCreated = await call('/auth/api-key/create', {
        cookie: sCookie,
        body: { name: 'n8n' },
      });
      assert.equal(oCreated.status, 403);
    });

    test('after changing the password the session reaches the routes', async () => {
      // Changes the password
      const oChanged = await call('/auth/change-password', {
        cookie: sCookie,
        body: { currentPassword: DEFAULT_ADMIN_PASSWORD, newPassword: 'a-new-password-123' },
      });
      assert.equal(oChanged.status, 200, JSON.stringify(oChanged.body));
      sCookie = cookieOf(oChanged.headers) || sCookie;

      // The route and the admin endpoints answer
      const { status, body } = await call('/private', { cookie: sCookie });
      assert.equal(status, 200, JSON.stringify(body));
      assert.equal(body.result, 'private');
      assert.equal((await call('/auth/admin/list-users', { cookie: sCookie })).status, 200);
    });

    test('an API key created from the session reaches the routes on its own', async () => {
      // Creates a key
      const oCreated = await call('/auth/api-key/create', {
        cookie: sCookie,
        body: { name: 'n8n' },
      });
      assert.equal(oCreated.status, 200, JSON.stringify(oCreated.body));

      // The key reaches the route
      const { status, body } = await call('/private', { apiKey: oCreated.body.key });
      assert.equal(status, 200, JSON.stringify(body));

      // An invalid key does not
      const oInvalid = await call('/private', { apiKey: 'not-a-key' });
      assert.equal(oInvalid.status, 403, JSON.stringify(oInvalid.body));
      assert.equal(oInvalid.body.success, false);
    });
  },
);
