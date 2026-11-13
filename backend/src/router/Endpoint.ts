import { NanoError } from '@nano-app/core';
import Auth from '../auth/Auth';
import type { Request, RequestHandler } from 'express';
import type { ApiPromise, NanoObject } from '@nano-app/core';
import type { Callbacks, EndpointParams, MethodEntry, Params } from '../types/route';

/** Base class for all endpoints */
export default class Endpoint {
  private oMethods: NanoObject<MethodEntry>;
  private oCallbacks: Callbacks;
  private isPublic: boolean;

  /** Allowed methods and the options of the route */
  constructor({
    callbacks = {},
    public: isPublic = false,
    permissions,
    ...oMethods
  }: EndpointParams) {
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

  /** Runs its onInit and gives its handler for all methods */
  public async init(oParams: Params): Promise<RequestHandler> {
    // Runs the onInit callback
    await this.oCallbacks.onInit?.(oParams);

    // Returns the request handler
    return (oReq, oRes) =>
      // Runs it; a rejection reaches the error handler: Express 5 forwards it
      this.run(oReq, oParams).then(oResponse => {
        // Answers with the status of the handler, 200 by default, and its success
        const { status, ...oBody } = oResponse;
        const iStatus = status ?? 200;
        oRes.status(iStatus).json({ ...oBody, success: iStatus < 400 });
      });
  }

  /** Checks the session and the permissions of the method, then runs onBefore and it */
  private async run(oReq: Request, oParams: Params): ApiPromise {
    // The method of the request: a route file holds only HTTP methods
    const sMethod = oReq.method;
    const oMethod = this.oMethods[sMethod];

    // The session, checked with the permissions of the method; then 405 without it
    const session = await Auth.guard(oReq, this.isPublic, oMethod?.permissions);
    if (!oMethod) throw new NanoError(`Method ${sMethod} not implemented`, 405);

    // Runs onBefore, then the method
    const oRequestParams = { ...oParams, session };
    const onBeforeResult = (await this.oCallbacks.onBefore?.(oReq, sMethod, oRequestParams)) ?? {};
    return oMethod.handler(oReq, { ...oRequestParams, onBeforeResult });
  }
}
