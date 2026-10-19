import type { NanoObject } from './objects';

// any: `T` is the consumer's result, unknown to the framework

/** API response */
export type ApiResponse<T = any> = {
  success?: boolean;
  result?: T;
  message?: string;
  warning?: boolean;
};

/** Promise of an API response, what a handler returns */
export type ApiPromise<T = any> = Promise<ApiResponse<T>>;

/** Query parameters sent in the `query` header (JSON). */
export type QueryParams = {
  skip?: number;
  top?: number;
  filter?: NanoObject;
  orderby?: Record<string, 'asc' | 'desc'>;
  select?: string;
};
