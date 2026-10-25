import type { ApiError } from '@nano-app/frontend';

/** Methods an `error` gives its view, over the `/error/list` of every api store */
export type ErrorMethods = {
  /** Errors of all the stores, in the order they came */
  items(): ApiError[];
  /** The last error, `undefined` when there is none */
  last(): ApiError | undefined;
  /** Removes an error from its store */
  dismiss(error: ApiError): void;
  /** Removes the errors of every store */
  clear(): void;
};
