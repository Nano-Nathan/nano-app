import { Logger, NanoError } from '@nano-app/core';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiResponse, NanoObject } from '@nano-app/core';
import type { HandlerError } from '../types/app';

/** Postgres errors the request caused, by their code; their own messages name tables and columns */
const POSTGRES_ERRORS: NanoObject<HandlerError> = {
  '23505': { status: 409, message: 'Conflict' },
  '23503': { status: 409, message: 'Conflict' },
  '23502': { status: 400, message: 'Invalid request' },
  '22P02': { status: 400, message: 'Invalid request' },
};

/** Whether anything thrown is an object, read as a HandlerError or a Drizzle error with its Postgres cause */
function isHandlerError(oError: unknown): oError is HandlerError & { cause?: { code?: string } } {
  return typeof oError === 'object' && oError !== null;
}

/** Normalizes anything thrown by a handler into an ApiResponse plus its status */
function normalize(oError: unknown): { status: number; body: ApiResponse } {
  // Strings are thrown as a shortcut for a bad request
  if (typeof oError === 'string') {
    return { status: 400, body: { success: false, message: oError } };
  }

  // An object is read as { status, message, warning }; anything else has none of them
  const oThrown = isHandlerError(oError) ? oError : {};

  // A Postgres error caused by the request answers its own status, never its message
  const { status, message, warning } = POSTGRES_ERRORS[oThrown.cause?.code ?? ''] ?? oThrown;

  // A server error never answers its message, which may carry internals: it is logged in full
  const iStatus = status ?? 500;
  return {
    status: iStatus,
    body: {
      success: false,
      warning: warning ?? false,
      message: (iStatus < 500 && message) || 'Internal server error',
    },
  };
}

/** Turns every unmatched request into a 404 for the error handler */
export const notFoundHandler: RequestHandler = (oReq, _oRes, fnNext) => {
  fnNext(new NanoError(`${oReq.path} not found`, 404));
};

/** Turns any error raised by a handler into an ApiResponse */
export const errorHandler: ErrorRequestHandler = (oError, _oReq, oRes, _fnNext) => {
  // Normalizes what was thrown
  const { status, body } = normalize(oError);

  // Server errors are logged in full; the response carries only the message
  if (status >= 500) {
    Logger.error('Internal server error', oError);
  }

  // Answers with the status and the body
  oRes.status(status).json(body);
};
