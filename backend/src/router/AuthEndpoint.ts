import { NanoError } from '@nano-app/core';
import Endpoint from './Endpoint';
import isGranted from '../auth/permissions';
import type { Request } from 'express';
import type { Handlers, MethodEntry, NanoObject, Params, RouteEntry } from '@nano-app/core';

/** Endpoint behind Better Auth: a session unless it is public, and the permissions of the method */
export default class AuthEndpoint extends Endpoint {
  private oAuth: NanoObject;
  protected override isGuarded = true;

  /** Allowed methods, the options of the route and Better Auth's instance */
  constructor(
    oMethods: Handlers,
    oOptions: Pick<RouteEntry, 'callbacks' | 'public' | 'permissions'>,
    oAuth: NanoObject,
  ) {
    super(oMethods, oOptions);
    this.oAuth = oAuth;
  }

  /** The params with the session; 401 without one unless public, 403 without the permissions */
  protected override async guard(
    oReq: Request,
    oMethod: MethodEntry,
    oParams: Params,
  ): Promise<Params> {
    // Better Auth is an optional dependency: imported only when it is on
    const { fromNodeHeaders } = await import('better-auth/node');

    // The session of the request, when there is one
    const oSession = await this.oAuth.api.getSession({ headers: fromNodeHeaders(oReq.headers) });
    const oRequestParams = { ...oParams, session: oSession ?? undefined };

    // A public route answers with or without a session
    if (this.isPublic) return oRequestParams;

    // Otherwise it needs a session and the permissions of the method
    if (!oSession) throw new NanoError('Not authenticated', 401);
    const isAllowed = await isGranted(oRequestParams, oMethod.permissions);
    if (!isAllowed) throw new NanoError('Forbidden', 403);
    return oRequestParams;
  }
}
