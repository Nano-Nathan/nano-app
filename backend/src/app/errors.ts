import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiResponse } from '@nano-app/core';

/** Error shape thrown by the consumer handlers */
type HandlerError = {
  status?: number;
  message?: string;
  warning?: boolean;
};

/** Normalizes anything thrown by a handler into an ApiResponse plus its status */
function normalize(oError: unknown): { status: number; body: ApiResponse } {
  // Strings are thrown as a shortcut for a bad request
  if (typeof oError === 'string') {
    return { status: 400, body: { success: false, message: oError } };
  }

  // Anything else is read as { status, message, warning }
  const { status, message, warning } = (oError ?? {}) as HandlerError;

  return {
    status: status ?? 500,
    body: {
      success: false,
      warning: warning ?? false,
      message: message || 'Internal server error',
    },
  };
}

/** Turns every unmatched request into a 404 for the error handler */
export const notFoundHandler: RequestHandler = (oReq, _oRes, fnNext) => {
  fnNext({ status: 404, message: `${oReq.path} not found` });
};

/** Turns any error raised by a handler into an ApiResponse */
export const errorHandler: ErrorRequestHandler = (oError, _oReq, oRes, _fnNext) => {
  // Normalizes what was thrown
  const { status, body } = normalize(oError);

  // Server errors are logged in full; the response carries only the message
  if (status >= 500) {
    console.error('[nano-app] [ERROR]', oError);
  }

  // Answers with the status and the body
  oRes.status(status).json(body);
};
