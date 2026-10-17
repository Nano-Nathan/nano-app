import type { RequestHandler } from "express";
import type { Callbacks, Handlers, Params } from "@nano-app/core";

/** Base class for all endpoints */
export class Endpoint {
  private methods: Handlers;
  private callbacks: Callbacks;

  /** Allowed methods */
  constructor(methods: Handlers, callbacks: Callbacks = {}) {
    this.methods = methods;
    this.callbacks = callbacks;
  }

  /** Handler for all methods */
  async mount(params: Params): Promise<RequestHandler> {
    // Runs the onInit callback
    await this.callbacks.onInit?.(params);

    // Returns the request handler
    return this.createHandler(params);
  }

  private createHandler: (params: Params) => RequestHandler = (params) => (req, res, next) => {
    const method = req.method.toUpperCase() as keyof Handlers;
    const fnMethod = this.methods[method];

    // Checks whether the method is defined
    if (fnMethod) {
      // Runs the onBefore callback
      (this.callbacks.onBefore?.(req, method, params) ?? Promise.resolve({}))
      .then((onBeforeResult) => (
        // Runs the method
        fnMethod(req, { ...params, onBeforeResult })
          // Handles the response
          .then((response) => {
            res.status(response.success ? 200 : 400).json(response);
          })
      ))
      // Forwards the error to the next error middleware
      .catch(next);
    } else {
      res.status(405).json({ success: false, message: `Method ${method} not implemented` });
    }
  }
}
