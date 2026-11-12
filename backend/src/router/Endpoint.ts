import { Logger, NanoError } from '@nano-app/core';
import BetterAuth from '../auth/BetterAuth';
import isGranted from '../auth/permissions';
import type { Request, RequestHandler } from 'express';
import type {
  ApiPromise,
  Callbacks,
  Handlers,
  MethodEntry,
  NanoObject,
  Params,
  RouteEntry,
} from '@nano-app/core';

/** Base class for all endpoints */
export default class Endpoint {
  private oMethods: NanoObject<MethodEntry>;
  private oCallbacks: Callbacks;
  private isPublic: boolean;

  /** Allowed methods and the options of the route */
  constructor(
    oMethods: Handlers,
    {
      callbacks = {},
      public: isPublic = false,
      permissions,
    }: Pick<RouteEntry, 'callbacks' | 'public' | 'permissions'>,
  ) {
    // Each method with its permissions, or those of the route
    this.oMethods = Object.fromEntries(
      Object.entries(oMethods).map(([sMethod, oMethod]) => [
        sMethod,
        typeof oMethod === 'function'
          ? { handler: oMethod, permissions }
          : { permissions, ...oMethod },
      ]),
    );
    this.oCallbacks = callbacks;
    this.isPublic = isPublic;
  }

  /** Handler for all methods */
  public async mount(oParams: Params, sPath: string): Promise<RequestHandler> {
    // Without Better Auth, a route with permissions answers without checking them
    const isUnchecked = Object.values(this.oMethods).some(({ permissions }) => permissions);
    if (!oParams.auth && isUnchecked) {
      Logger.warn(
        `${sPath}: its permissions are not checked without Better Auth. Set auth in createNanoApp.`,
      );
    }

    // Runs the onInit callback
    await this.oCallbacks.onInit?.(oParams);

    // Returns the request handler
    return this.createHandler(oParams);
  }

  /** Express handler: the request, answered as an ApiResponse */
  private createHandler(oParams: Params): RequestHandler {
    return (oReq, oRes) =>
      // Runs it; a rejection reaches the error handler: Express 5 forwards it
      this.run(oReq, oParams).then(oResponse => {
        // Answers with the status of the handler, 200 by default, and its success
        const { status, ...oBody } = oResponse;
        const iStatus = status ?? 200;
        oRes.status(iStatus).json({ ...oBody, success: iStatus < 400 });
      });
  }

  /** Checks the session and the permissions, then runs onBefore and the method */
  private async run(oReq: Request, oParams: Params): ApiPromise {
    // The session of the request, when Better Auth found one
    const oSession = await BetterAuth.session(oReq);
    const oRequestParams = { ...oParams, session: oSession };

    // With Better Auth on, a route needs a session unless it is public
    if (oParams.auth && !oSession && !this.isPublic) {
      throw new NanoError('Not authenticated', 401);
    }

    // Finds the handler of the request method: a route file holds only HTTP methods
    const sMethod = oReq.method;
    const oMethod = this.oMethods[sMethod];
    if (!oMethod) throw new NanoError(`Method ${sMethod} not implemented`, 405);

    // Checks the permissions of the method, unless the route is public
    const oPermissions = this.isPublic ? undefined : oMethod.permissions;
    if (!(await isGranted(oRequestParams, oPermissions))) throw new NanoError('Forbidden', 403);

    // Runs onBefore, then the method
    const onBeforeResult = (await this.oCallbacks.onBefore?.(oReq, sMethod, oRequestParams)) ?? {};
    return oMethod.handler(oReq, { ...oRequestParams, onBeforeResult });
  }
}
