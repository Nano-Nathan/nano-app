import { APIError } from 'better-auth/api';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { createPluginCallbacks } from '@nano-app/backend';
import { CHANGE_PASSWORD_MESSAGE, ensureAdmin } from './admin';
import { createAuth } from './instance';
import { pendingMigrations } from './migrate';
import type { PluginConfig } from '@nano-app/backend';
import type { Auth, AuthOptions } from '../types/auth';

/**
 * Better Auth on `basePath`, and a guard in front of everything mounted after this plugin.
 * Not a `createPlugin` factory: its config carries the Better Auth instance, not the options it receives
 */
export default function auth(oOptions: AuthOptions = {}): PluginConfig<{ auth: Auth }> {
  // Better Auth instance, created with the plugin so the migration command can read it
  const { basePath = '/auth', publicPaths = [], betterAuth } = oOptions;
  const oAuth = createAuth(basePath, betterAuth);

  return {
    name: 'auth',
    basePath,
    stage: 'before',
    // No routes of its own: Better Auth answers every path under basePath
    routesDir: '',
    options: { auth: oAuth },
    callbacks: createPluginCallbacks({
      onMount: async oApp => {
        // Migrations are manual: the startup only checks them
        const sPending = await pendingMigrations(oAuth);
        if (sPending) {
          throw new Error(
            `[nano-app] [ERROR] auth: ${sPending}. Run \`nano-app-auth migrate\` first.`,
          );
        }

        // Creates the admin on the first startup
        await ensureAdmin(oAuth);

        // Better Auth endpoints, before the guard
        oApp.all(`${basePath}/*splat`, toNodeHandler(oAuth));

        // Guard: a session or an API key of a user that changed the default password
        oApp.use((oReq, _oRes, fnNext) => {
          // Public paths pass as they are
          if (publicPaths.includes(oReq.path)) return fnNext();

          // Reads the session from the cookie or the API key
          oAuth.api
            .getSession({ headers: fromNodeHeaders(oReq.headers) })
            .then(oSession => {
              if (!oSession) return fnNext({ status: 401, message: 'Unauthorized' });
              if ((oSession.user as { mustChangePassword?: boolean }).mustChangePassword) {
                return fnNext({ status: 403, message: CHANGE_PASSWORD_MESSAGE });
              }
              fnNext();
            })
            // Better Auth errors (e.g. an invalid API key) carry their HTTP status in statusCode
            .catch(oError =>
              fnNext(
                oError instanceof APIError
                  ? { status: oError.statusCode, message: oError.message }
                  : oError,
              ),
            );
        });
      },
    }),
  };
}
