import type { RequestHandler } from 'express';
import type { BetterAuthOptions } from 'better-auth';
import type { PluginConfig } from '../types/plugin';

/** Better Auth inside the app's plugin: its endpoints, then a session guard before the routes */
export default abstract class BetterAuth {
  /** The app's plugin with Better Auth mounted first in its onMount */
  public static withAuth(oPlugin: PluginConfig, oOptions: BetterAuthOptions): PluginConfig {
    const { callbacks } = oPlugin;

    return {
      ...oPlugin,
      callbacks: {
        ...callbacks,
        onMount: async (oApp, oParams) => {
          // Endpoints and guard, after the app's database and before the consumer's onMount
          const { oHandler, fnGuard, sPath } = await this.create(oOptions, oParams.db);
          oApp.all(sPath, oHandler);
          oApp.use(fnGuard);
          console.log(`[nano-app] [INFO] ${sPath}`);

          // The consumer's own setup
          await callbacks?.onMount?.(oApp, oParams);
        },
      },
    };
  }

  /** Creates the instance on the app's client, its handler and the guard */
  // any: the Prisma client is generated per app, unknown to the framework
  private static async create(
    oOptions: BetterAuthOptions,
    oDb: any,
  ): Promise<{ oHandler: RequestHandler; fnGuard: RequestHandler; sPath: string }> {
    // Better Auth is an optional dependency: imported only when it is on
    const { betterAuth } = await import('better-auth');
    const { prismaAdapter } = await import('better-auth/adapters/prisma');
    const { getSchema } = await import('better-auth/db');
    const { fromNodeHeaders, toNodeHandler } = await import('better-auth/node');

    // Checks that the app's schema has every model these options need
    const aMissing = Object.keys(getSchema(oOptions)).filter(sModel => !oDb[sModel]);
    if (aMissing.length) {
      throw new Error(
        `[nano-app] [ERROR] Better Auth needs the models ${aMissing.join(', ')} in the app's schema. Run \`npx auth generate\` and apply your schema with Prisma.`,
      );
    }

    // Creates the instance on the app's client
    const oAuth = betterAuth({
      ...oOptions,
      database: prismaAdapter(oDb, { provider: 'postgresql' }),
    });

    // Guard: a session for every request that reaches it; the handlers receive it in params
    const fnGuard: RequestHandler = (oReq, oRes, fnNext) => {
      oAuth.api
        .getSession({ headers: fromNodeHeaders(oReq.headers) })
        .then(oSession => {
          if (!oSession) return fnNext({ status: 401, message: 'Not authenticated' });
          oRes.locals.session = oSession;
          fnNext();
        })
        .catch(fnNext);
    };

    return {
      oHandler: toNodeHandler(oAuth),
      fnGuard,
      sPath: `${oAuth.options.basePath ?? '/api/auth'}/{*path}`,
    };
  }
}
