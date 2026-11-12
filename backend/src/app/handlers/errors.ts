import { Logger, NanoError } from '@nano-app/core';
import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Turns every unmatched request into a 404 for the error handler */
export const notFoundHandler: RequestHandler = (oReq, _oRes, fnNext) => {
  fnNext(new NanoError(`${oReq.path} not found`, 404));
};

/** Answers anything a handler throws as an ApiResponse */
export const errorHandler: ErrorRequestHandler = (oError, _oReq, oRes, _fnNext) => {
  // A string is a bad request; anything else answers its status, 500 without one
  const oThrown = typeof oError === 'string' ? new NanoError(oError, 400) : oError;
  const iStatus = oThrown?.status ?? 500;
  const sMessage = iStatus < 500 ? oThrown.message : 'Internal server error';

  // A server error is logged in full, with what was thrown
  if (iStatus >= 500) Logger.error(sMessage, oError);

  // Answers with the status and the body
  oRes
    .status(iStatus)
    .json({ success: false, warning: oThrown.warning ?? false, message: sMessage });
};
