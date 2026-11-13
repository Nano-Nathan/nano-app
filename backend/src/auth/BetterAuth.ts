import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import DatabaseManager from '../database/DatabaseManager';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import type { Auth } from 'better-auth';
import type { NanoObject } from '@nano-app/core';
import type { Mount } from '../types/app';
import type { AuthOptions } from '../types/auth';

/** Postgres schema of Better Auth's tables */
const SCHEMA = 'nano_auth';

/** Better Auth of the app: its tables in `nano_auth`, its endpoints and the session of a request */
export default abstract class BetterAuth {
  private static oAuth?: Auth<any>;
  private static fnHeaders?: (oHeaders: IncomingHttpHeaders) => Headers;

  /** Better Auth's instance, once mounted */
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

  /** Whether the user of a session has the permissions; always without Better Auth or permissions */
  public static async isGranted(
    oSession?: NanoObject,
    oPermissions?: NanoObject<string[]>,
  ): Promise<boolean> {
    // Nothing to check without Better Auth or permissions
    if (!this.oAuth || !oPermissions) return true;

    // Asks its admin plugin, unknown to the type of the instance, about the role of the user
    const oApi: NanoObject = this.oAuth.api;
    const { success } = await oApi.userHasPermission({
      body: { userId: oSession?.user.id, role: oSession?.user.role, permissions: oPermissions },
    });
    return success;
  }

  /** Migrates its tables and creates the instance; its endpoints, none without options */
  public static async init(oOptions?: AuthOptions): Promise<Mount[]> {
    // Without options Better Auth stays off
    if (!oOptions) return [];

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
    await DatabaseManager.lock(async () => (await getMigrations(oFullOptions)).runMigrations());

    // The instance and its endpoints
    const oAuth = betterAuth(oFullOptions);
    this.oAuth = oAuth;
    this.fnHeaders = fromNodeHeaders;
    return [{ path: `${basePath}/{*path}`, handler: toNodeHandler(oAuth) }];
  }
}
