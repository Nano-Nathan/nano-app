import type { RequestHandler } from 'express';
import type { BetterAuthOptions } from 'better-auth';
import type { NanoObject } from '@nano-app/core';

/** Better Auth on the app's Prisma client: the instance, its handler and the session lookup */
export default abstract class BetterAuth {
  private static oAuth?: NanoObject;

  /** The instance, once the app's plugin created it */
  public static get(): NanoObject | undefined {
    return this.oAuth;
  }

  /** Creates the instance on the app's client, its handler and the session lookup */
  // any: the Prisma client is generated per app, unknown to the framework
  public static async create(
    oOptions: BetterAuthOptions,
    oDb: any,
  ): Promise<{ oHandler: RequestHandler; fnSession: RequestHandler; sPath: string }> {
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
    this.oAuth = oAuth;

    // Session lookup: the session of every request that reaches it, if any; each endpoint decides whether it needs one
    const fnSession: RequestHandler = (oReq, oRes, fnNext) => {
      oAuth.api
        .getSession({ headers: fromNodeHeaders(oReq.headers) })
        .then(oSession => {
          // The session of the request, when there is one
          oRes.locals.session = oSession ?? undefined;
          fnNext();
        })
        .catch(fnNext);
    };

    return {
      oHandler: toNodeHandler(oAuth),
      fnSession,
      sPath: `${oOptions.basePath ?? '/api/auth'}/{*path}`,
    };
  }
}
