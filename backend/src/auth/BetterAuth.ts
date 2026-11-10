import { existsSync } from 'node:fs';
import { FileReader, NanoError, Validator } from '@nano-app/core';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import type { RequestHandler } from 'express';
import type { NanoObject } from '@nano-app/core';
import type { AuthOptions } from '../types/app';

/** Files of the app's Better Auth options, relative to `cwd`: source, then built */
const AUTH_FILES = ['src/auth.ts', 'src/auth.js'];

/** Better Auth on the app's Drizzle client: the instance, its handler and the session lookup */
export default abstract class BetterAuth {
  private static oAuth?: NanoObject;

  /** The options of the app's `src/auth.ts`, or undefined without it: Better Auth stays off */
  public static async findOptions(): Promise<AuthOptions | undefined> {
    // Finds the file
    const sFilePath = AUTH_FILES.find(existsSync);
    if (!sFilePath) return undefined;

    // Loads its default export
    const oFile: { options?: AuthOptions } = await FileReader.loadModule(sFilePath, {
      default: true,
    });

    // Checks that it holds the options
    if (!Validator.isObject(oFile?.options)) {
      throw new NanoError(`${sFilePath} must default export { options }: the Better Auth options.`);
    }

    return oFile.options;
  }

  /** The instance, once the app's plugin created it */
  public static get(): NanoObject | undefined {
    return this.oAuth;
  }

  /** Creates the instance on the app's client and schema, its handler and the session lookup */
  // any: the client is typed by the schema of each app, unknown to the framework
  public static async create(
    oOptions: AuthOptions,
    oDb: any,
    oSchema: NanoObject,
  ): Promise<{ oHandler: RequestHandler; fnSession: RequestHandler; sPath: string }> {
    // Better Auth is an optional dependency: imported only when it is on
    const { betterAuth } = await import('better-auth');
    const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
    const { getSchema } = await import('better-auth/db');
    const { fromNodeHeaders, toNodeHandler } = await import('better-auth/node');

    // Checks that the app's schema has every table these options need
    const aMissing = Object.keys(getSchema(oOptions)).filter(sModel => !oSchema[sModel]);
    if (aMissing.length) {
      throw new NanoError(
        `Better Auth needs the tables ${aMissing.join(', ')} in the app's schema. Run \`npx auth generate\` and apply your schema with drizzle-kit.`,
      );
    }

    // Creates the instance on the app's client, with the trusted proxies of Express by default
    const oAuth = betterAuth({
      ...oOptions,
      advanced: {
        ...oOptions.advanced,
        ipAddress: { trustedProxies: PRIVATE_NETWORKS, ...oOptions.advanced?.ipAddress },
      },
      database: drizzleAdapter(oDb, { provider: 'pg', schema: oSchema }),
    });

    // Keeps the instance for the plugins mounted with the app or after it
    this.oAuth = oAuth;

    // Session lookup: the session of every request that reaches it, if any; each endpoint decides whether it needs one
    const fnSession: RequestHandler = (oReq, oRes, fnNext) =>
      oAuth.api.getSession({ headers: fromNodeHeaders(oReq.headers) }).then(oSession => {
        // The session of the request, when there is one
        oRes.locals.session = oSession ?? undefined;
        fnNext();
      });

    return {
      oHandler: toNodeHandler(oAuth),
      fnSession,
      sPath: `${oOptions.basePath ?? '/api/auth'}/{*path}`,
    };
  }
}
