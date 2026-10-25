import { HTTP_METHODS } from '@nano-app/core/const';
import type { RequestHandler } from 'express';
import type { Callbacks, Handlers, Params } from '@nano-app/core';

/** Base class for all endpoints */
export default class Endpoint {
  private oMethods: Handlers;
  private oCallbacks: Callbacks;

  /** Allowed methods */
  constructor(oMethods: Handlers, oCallbacks: Callbacks = {}) {
    this.oMethods = oMethods;
    this.oCallbacks = oCallbacks;
  }

  /** Handler for all methods */
  public async mount(oParams: Params): Promise<RequestHandler> {
    // Runs the onInit callback
    await this.oCallbacks.onInit?.(oParams);

    // Returns the request handler
    return this.createHandler(oParams);
  }

  /** Express handler: onBefore, then the method of the request */
  private createHandler(oParams: Params): RequestHandler {
    return (oReq, oRes, fnNext) => {
      // Finds the handler of the request method
      const sMethod = oReq.method.toUpperCase();
      const sHandled = HTTP_METHODS.find(sHttpMethod => sHttpMethod === sMethod);
      const fnMethod = sHandled && this.oMethods[sHandled];

      // Checks whether the method is defined
      if (!fnMethod) return fnNext({ status: 405, message: `Method ${sMethod} not implemented` });

      // The session of the request, when Better Auth's guard found one
      const oRequestParams = { ...oParams, session: oRes.locals.session };

      // Runs the onBefore callback
      (this.oCallbacks.onBefore?.(oReq, sMethod, oRequestParams) ?? Promise.resolve({}))
        // Runs the method
        .then(onBeforeResult => fnMethod(oReq, { ...oRequestParams, onBeforeResult }))
        // Handles the response
        .then(oResponse => {
          oRes.status(oResponse.success ? 200 : 400).json(oResponse);
        })
        // Forwards the error to the next error middleware
        .catch(fnNext);
    };
  }
}
