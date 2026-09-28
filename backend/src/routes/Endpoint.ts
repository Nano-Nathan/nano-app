import { RequestHandler } from "express";
import type { Handlers } from "@nano-app/core";

/** Base class for all endpoints */
export class Endpoint {
  private methods: Handlers;

  /** Allowed methods */
  constructor(methods: Handlers) {
    this.methods = methods;
  }

  /** Handler for all methods */
  getHandler: (db: unknown) => RequestHandler = db => (req, res, next) => {
    const method = req.method.toUpperCase() as keyof Handlers;

    // Checks whether the method is defined
    if (this.methods[method]) {

      // Runs the method
      this.methods[method](req, db)
      // Handles the response
      .then((response) => {
        res.status(response.success ? 200 : 400).json(response);
      })
      // Forwards the error to the next error middleware
      .catch(next);

    } else {
      res.status(405).json({ success: false, message: `Method ${method} not implemented` });
    }
  }
}
