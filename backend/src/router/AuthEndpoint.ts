import { NanoError } from '@nano-app/core';
import Endpoint from './Endpoint';
import BetterAuth from '../auth/BetterAuth';
import isGranted from '../auth/permissions';
import type { Request } from 'express';
import type { MethodEntry, Params } from '@nano-app/core';

/** Endpoint behind Better Auth: a session unless it is public, and the permissions of the method */
export default class AuthEndpoint extends Endpoint {
  protected override isGuarded = true;

  /** The params with the session; 401 without one unless public, 403 without the permissions */
  protected override async guard(
    oReq: Request,
    oMethod: MethodEntry,
    oParams: Params,
  ): Promise<Params> {
    // The session of the request, when there is one
    const oSession = await BetterAuth.session(oReq);
    const oRequestParams = { ...oParams, session: oSession };

    // A public route answers with or without a session
    if (this.isPublic) return oRequestParams;

    // Otherwise it needs a session and the permissions of the method
    if (!oSession) throw new NanoError('Not authenticated', 401);
    const isAllowed = await isGranted(oRequestParams, oMethod.permissions);
    if (!isAllowed) throw new NanoError('Forbidden', 403);
    return oRequestParams;
  }
}
