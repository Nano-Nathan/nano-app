import { NanoError } from '@nano-app/core';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import type { RequestHandler } from 'express';
import type { NanoObject } from '@nano-app/core';
import type { AuthOptions } from '../types/auth';

/** Better Auth on the app's Drizzle client: the instance and its handler */
export default abstract class BetterAuth {
  private static oAuth?: NanoObject;

  /** The instance, once the app's plugin created it */
  public static get(): NanoObject | undefined {
    return this.oAuth;
  }

  /** Creates the instance on the app's client and schema, and its handler */
  // any: the client is typed by the schema of each app, unknown to the framework
  public static async create(
    oOptions: AuthOptions,
    oDb: any,
    oSchema?: NanoObject,
  ): Promise<{ oHandler: RequestHandler; sPath: string }> {
    // Better Auth is an optional dependency: imported only when it is on
    const { betterAuth } = await import('better-auth');
    const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
    const { getSchema } = await import('better-auth/db');
    const { toNodeHandler } = await import('better-auth/node');

    // Better Auth keeps its tables in the app's database
    if (!oSchema) {
      throw new NanoError(
        'auth needs the database of the app: set database.schema in createNanoApp.',
      );
    }

    // Checks that the app's schema has every table these options need
    const aMissing = Object.keys(getSchema(oOptions)).filter(sModel => !oSchema[sModel]);
    if (aMissing.length) {
      throw new NanoError(
        `Better Auth needs the tables ${aMissing.join(', ')} in the app's schema. Run \`npx auth generate\` and apply your schema with drizzle-kit.`,
      );
    }

    // Creates the instance on the app's client
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

    return {
      oHandler: toNodeHandler(oAuth),
      sPath: `${oOptions.basePath ?? '/api/auth'}/{*path}`,
    };
  }
}
