import type { ApiResponse } from '@nano-app/core/types/api';

/** Methods an `error` gives its view, over the `/error/list` of every api store */
export type ErrorMethods = {
  /** Errors of all the stores, in the order they came */
  items(): ApiResponse[];
  /** The last error, `undefined` when there is none */
  last(): ApiResponse | undefined;
  /** Removes an error from its store */
  dismiss(error: ApiResponse): void;
  /** Removes the errors of every store */
  clear(): void;
};
