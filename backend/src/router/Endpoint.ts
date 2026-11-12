import { Logger, NanoError } from '@nano-app/core';
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
  protected isPublic: boolean;
  /** Whether it checks the permissions of its methods */
  protected isGuarded = false;

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
    if (!this.isGuarded && isUnchecked) {
      Logger.warn(
        `${sPath}: its permissions are not checked without Better Auth. Set auth in createNanoApp.`,
      );
    }

    // Runs the onInit callback
    await this.oCallbacks.onInit?.(oParams);

    // Returns the request handler
    return this.createHandler(oParams);
  }

  /** Express handler: the method of the request, answered as an ApiResponse */
  private createHandler(oParams: Params): RequestHandler {
    return (oReq, oRes, fnNext) => {
      // Finds the handler of the request method: a route file holds only HTTP methods
      const oMethod = this.oMethods[oReq.method];

      // Checks whether the method is defined
      if (!oMethod) return fnNext(new NanoError(`Method ${oReq.method} not implemented`, 405));

      // Runs it; a rejection reaches the error handler: Express 5 forwards it
      return this.run(oReq, oMethod, oParams).then(oResponse => {
        // Answers with the status of the handler, 200 by default, and its success
        const { status, ...oBody } = oResponse;
        const iStatus = status ?? 200;
        oRes.status(iStatus).json({ ...oBody, success: iStatus < 400 });
      });
    };
  }

  /** Guards the request, then runs onBefore and the method */
  private async run(oReq: Request, oMethod: MethodEntry, oParams: Params): ApiPromise {
    const oRequestParams = await this.guard(oReq, oMethod, oParams);
    const onBeforeResult =
      (await this.oCallbacks.onBefore?.(oReq, oReq.method, oRequestParams)) ?? {};
    return oMethod.handler(oReq, { ...oRequestParams, onBeforeResult });
  }

  /** The params of a request that may go on; without Better Auth, every request may */
  protected async guard(_oReq: Request, _oMethod: MethodEntry, oParams: Params): Promise<Params> {
    return oParams;
  }
}
