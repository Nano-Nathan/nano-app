import type { ApiResponse } from '@nano-app/core/types/api';

/** Methods an `error` gives its view, over the `/error/list` of every api store */
export type ErrorMethods = {
  /** Errors of all the stores, in the order they came */
  items(): ApiResponse[];
  /** The last error, `undefined` when there is none */
  last(): ApiResponse | undefined;
  /** Removes the last error from its store */
  dismiss(): void;
  /** Removes the errors of every store */
  clear(): void;
};
