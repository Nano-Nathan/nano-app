import { NanoError } from '@nano-app/core';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import DatabaseManager from '../database/DatabaseManager';
import BetterAuth from '../database/clients/BetterAuth';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import type { Auth as BetterAuthInstance } from 'better-auth';
import type { NanoObject } from '@nano-app/core';
import type { Mount } from '../types/app';
import type { AuthOptions } from '../types/auth';

/** Name of Better Auth's database: its tables live in `nano_auth` */
const NAME = 'auth';

/** Better Auth of the app: its tables in `nano_auth`, its endpoints and the session of a request */
export default abstract class Auth {
  private static oAuth?: BetterAuthInstance<any>;
  private static fnHeaders?: (oHeaders: IncomingHttpHeaders) => Headers;

  /** Mounts its database and creates the instance; its endpoints, none without options */
  public static async init(oOptions?: AuthOptions): Promise<Mount[]> {
    // Without options Better Auth stays off
    if (!oOptions) return [];

    // Better Auth is an optional dependency: imported only when it is on
    const { betterAuth } = await import('better-auth');
    const { fromNodeHeaders, toNodeHandler } = await import('better-auth/node');

    // Its options, trusting the private proxies by default
    const { database = { push: true }, advanced, basePath = '/api/auth', ...oRest } = oOptions;
    const oFullOptions = {
      ...oRest,
      basePath,
      advanced: {
        ...advanced,
        ipAddress: { trustedProxies: PRIVATE_NETWORKS, ...advanced?.ipAddress },
      },
    };

    // Its tables in their own schema, applied as its database says
    const oDatabase = await DatabaseManager.mount(new BetterAuth(NAME, database, oFullOptions));

    // The instance and its endpoints
    const oAuth = betterAuth({ ...oFullOptions, database: oDatabase });
    this.oAuth = oAuth;
    this.fnHeaders = fromNodeHeaders;
    return [{ path: `${basePath}/{*path}`, handler: toNodeHandler(oAuth) }];
  }

  /** The session of a request; 401 without one unless public, 403 without the permissions */
  public static async guard(
    oReq: Request,
    isPublic: boolean,
    oPermissions?: NanoObject<string[]>,
  ): Promise<NanoObject | undefined> {
    // With Better Auth on, a route needs a session unless it is public
    const oSession = await this.session(oReq);
    if (this.oAuth && !oSession && !isPublic) throw new NanoError('Not authenticated', 401);

    // Checks the permissions, unless the route is public
    const isAllowed = await this.isGranted(oSession, isPublic ? undefined : oPermissions);
    if (!isAllowed) throw new NanoError('Forbidden', 403);
    return oSession;
  }

  /** The session of a request, when it has one */
  private static async session(oReq: Request): Promise<NanoObject | undefined> {
    // Before the mount there is no instance, so no session
    if (!this.oAuth || !this.fnHeaders) return undefined;

    // Asks Better Auth with the headers of the request
    const headers = this.fnHeaders(oReq.headers);
    return (await this.oAuth.api.getSession({ headers })) ?? undefined;
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
}
