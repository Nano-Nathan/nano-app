import type { ApiError } from '@nano-app/frontend';

/** Methods an `error` gives its view, over the `/error/list` of every api store */
export type ErrorMethods = {
  /** Errors of all the stores, from the newest */
  items(): ApiError[];
  /** Removes the error at an index of the items from its store */
  remove(index: number): void;
  /** The newest error, `undefined` when there is none */
  last(): ApiError | undefined;
  /** Removes the newest error from its store */
  dismiss(): void;
  /** Removes the errors of every store */
  clear(): void;
};
