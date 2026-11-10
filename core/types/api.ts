import type { NanoObject } from './objects';

// any: `T` is the consumer's result, unknown to the framework

/** API response */
export type ApiResponse<T = any> = {
  status?: number;
  success?: boolean;
  result?: T;
  /** Total of a list, for a table to paginate */
  count?: number;
  message?: string;
  warning?: boolean;
};

/** Promise of an API response, what a handler returns */
export type ApiPromise<T = any> = Promise<ApiResponse<T>>;

/** Query parameters, sent as the JSON body of a `QUERY` request */
export type QueryParams = {
  /** Drizzle's relational filter: `{ title: { like: 'a%' } }` */
  where?: NanoObject;
  /** Columns to answer: `{ id: true, title: true }` */
  columns?: NanoObject<boolean>;
  orderBy?: NanoObject<'asc' | 'desc'>;
  limit?: number;
  offset?: number;
};
