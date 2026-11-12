import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import DatabaseManager from '../database/DatabaseManager';
import type { Express, Request } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import type { Auth } from 'better-auth';
import type { NanoObject } from '@nano-app/core';
import type { AuthOptions } from '../types/auth';

/** Postgres schema of Better Auth's tables */
const SCHEMA = 'nano_auth';

/** Key of the Postgres lock that lets one startup migrate at a time */
const MIGRATION_LOCK = 7_310_002;

/** Better Auth of the app: its tables in `nano_auth`, its endpoints and the session of a request */
export default abstract class BetterAuth {
  // any: the options of each app type the instance, unknown to the framework
  private static oAuth?: Auth<any>;
  private static fnHeaders?: (oHeaders: IncomingHttpHeaders) => Headers;

  /** Better Auth's instance, once mounted */
  // any: the options of each app type the instance, unknown to the framework
  public static instance(): Auth<any> | undefined {
    return this.oAuth;
  }

  /** The session of a request, when it has one */
  public static async session(oReq: Request): Promise<NanoObject | undefined> {
    // Before the mount there is no instance, so no session
    if (!this.oAuth || !this.fnHeaders) return undefined;

    // Asks Better Auth with the headers of the request
    const oHeaders = this.fnHeaders(oReq.headers);
    return (await this.oAuth.api.getSession({ headers: oHeaders })) ?? undefined;
  }

  /** Migrates its tables, creates the instance and mounts its endpoints; off without options */
  public static async mount(oApp: Express, oOptions?: AuthOptions): Promise<void> {
    // Without options Better Auth stays off
    if (!oOptions) return;

    // Better Auth and Kysely are optional dependencies: imported only when it is on
    const { betterAuth } = await import('better-auth');
    const { getMigrations } = await import('better-auth/db/migration');
    const { fromNodeHeaders, toNodeHandler } = await import('better-auth/node');
    const { PostgresDialect } = await import('kysely');

    // The options on the shared pool, with the tables in their own schema
    const oPool = await DatabaseManager.pool();
    const { advanced, basePath = '/api/auth' } = oOptions;
    const oFullOptions = {
      ...oOptions,
      advanced: {
        ...advanced,
        ipAddress: { trustedProxies: PRIVATE_NETWORKS, ...advanced?.ipAddress },
      },
      database: {
        dialect: new PostgresDialect({ pool: oPool }),
        type: 'postgres' as const,
        schemaName: SCHEMA,
      },
    };

    // Creates its schema and tables, one startup at a time; only adds
    const oConnection = await oPool.connect();
    await oConnection.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await (await getMigrations(oFullOptions)).runMigrations();

    // Closing the connection frees the lock
    oConnection.release(true);

    // The instance and its endpoints
    const oAuth = betterAuth(oFullOptions);
    this.oAuth = oAuth;
    this.fnHeaders = fromNodeHeaders;
    oApp.all(`${basePath}/{*path}`, toNodeHandler(oAuth));
  }
}
