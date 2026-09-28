import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiResponse } from "@nano-app/core";

/** Error shape thrown by the consumer handlers */
type HandlerError = {
  status?: number;
  message?: string;
  warning?: boolean;
};

/** Normalizes anything thrown by a handler into an ApiResponse plus its status */
function normalize(error: unknown): { status: number; body: ApiResponse } {
  // Strings are thrown as a shortcut for a bad request
  if (typeof error === "string") {
    return { status: 400, body: { success: false, message: error } };
  }

  const { status, message, warning } = (error ?? {}) as HandlerError;

  return {
    status: status ?? 500,
    body: {
      success: false,
      warning: warning ?? false,
      message: message || "Internal server error",
    },
  };
}
/** Turns every unmatched request into a 404 for the error handler */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next({ status: 404, message: `${req.path} not found` });
};

/** Turns any error raised by a handler into an ApiResponse */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const { status, body } = normalize(error);

  if (status >= 500) {
    console.error("[nano-app] [ERROR]", error);
  }

  res.status(status).json(body);
};
