import { HTTP_METHODS } from '@nano-app/core/const';
import type { RequestHandler } from 'express';
import type { Callbacks, Handlers, NanoObject, Params, RouteEntry } from '@nano-app/core';

/** Base class for all endpoints */
export default class Endpoint {
  private oMethods: Handlers;
  private oCallbacks: Callbacks;
  private isPublic: boolean;
  private oPermissions?: NanoObject<string[]>;

  /** Allowed methods and the options of the route */
  constructor(
    oMethods: Handlers,
    {
      callbacks = {},
      public: isPublic = false,
      permissions,
    }: Pick<RouteEntry, 'callbacks' | 'public' | 'permissions'>,
  ) {
    this.oMethods = oMethods;
    this.oCallbacks = callbacks;
    this.isPublic = isPublic;
    this.oPermissions = permissions;
  }

  /** Handler for all methods */
  public async mount(oParams: Params, sPath: string): Promise<RequestHandler> {
    // Without Better Auth, a route with permissions answers without checking them
    if (this.oPermissions && !oParams.auth) {
      console.warn(
        `[nano-app] [WARNING] ${sPath}: its permissions are not checked without Better Auth. Turn on packages.betterAuth.`,
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
      const fnMethod = sHandled && this.oMethods[sHandled];

      // Checks whether the method is defined
      if (!fnMethod) return fnNext({ status: 405, message: `Method ${sMethod} not implemented` });

      // The session of the request, when Better Auth found one
      const oRequestParams = { ...oParams, session: oRes.locals.session };

      // Checks the permissions of the route, then runs the onBefore callback
      this.isGranted(oRequestParams)
        .then(isGranted => {
          if (!isGranted) throw { status: 403, message: 'Forbidden' };
          return this.oCallbacks.onBefore?.(oReq, sMethod, oRequestParams) ?? {};
        })
        // Runs the method
        .then(onBeforeResult => fnMethod(oReq, { ...oRequestParams, onBeforeResult }))
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

  /** Whether the user of the session has the permissions of the route, by Better Auth */
  private async isGranted({ auth, session }: Params): Promise<boolean> {
    // Nothing to check without Better Auth or permissions, or on a public route
    if (!auth || !this.oPermissions || this.isPublic) return true;

    // Asks Better Auth whether the role of the user has the permissions
    const { success } = await auth.api.userHasPermission({
      body: { userId: session?.user.id, role: session?.user.role, permissions: this.oPermissions },
    });
    return success;
  }
}
