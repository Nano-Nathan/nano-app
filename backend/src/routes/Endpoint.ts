import { Formatter } from '@nano-app/core';
import { HTTP_METHODS } from '@nano-app/core/const';
import isGranted from '../auth/permissions';
import type { RequestHandler } from 'express';
import type {
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
    // Each method with its handler and permissions: its own, or else those of the route
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
    if (!oParams.auth && Object.values(this.oMethods).some(({ permissions }) => permissions)) {
      console.warn(
        Formatter.message(
          'WARNING',
          `${sPath}: its permissions are not checked without Better Auth. Add src/auth.ts.`,
        ),
      );
    }

    // Runs the onInit callback
    await this.oCallbacks.onInit?.(oParams);

    // Returns the request handler
    return this.createHandler(oParams);
  }

  /** Express handler: onBefore, then the method of the request */
  private createHandler(oParams: Params): RequestHandler {
    return (oReq, oRes, fnNext) => {
      // With Better Auth on, a route needs a session unless it is public
      if (oParams.auth && !oRes.locals.session && !this.isPublic)
        return fnNext({ status: 401, message: 'Not authenticated' });

      // Finds the handler of the request method
      const sMethod = oReq.method.toUpperCase();
      const sHandled = HTTP_METHODS.find(sHttpMethod => sHttpMethod === sMethod);
      const oMethod = sHandled && this.oMethods[sHandled];

      // Checks whether the method is defined
      if (!oMethod) return fnNext({ status: 405, message: `Method ${sMethod} not implemented` });

      // The session of the request, when Better Auth found one
      const oRequestParams = { ...oParams, session: oRes.locals.session };

      // Checks the permissions of the method, none on a public route, then runs the onBefore callback
      isGranted(oRequestParams, this.isPublic ? undefined : oMethod.permissions)
        .then(isAllowed => {
          if (!isAllowed) throw { status: 403, message: 'Forbidden' };
          return this.oCallbacks.onBefore?.(oReq, sMethod, oRequestParams) ?? {};
        })
        // Runs the method
        .then(onBeforeResult => oMethod.handler(oReq, { ...oRequestParams, onBeforeResult }))
        // Handles the response
        .then(oResponse => {
          // Answers with the status of the handler, 200 by default, and its success
          const { status, ...oBody } = oResponse;
          const iStatus = status ?? 200;
          oRes.status(iStatus).json({ ...oBody, success: iStatus < 400 });
        })
        // Forwards the error to the next error middleware
        .catch(fnNext);
    };
  }
}
