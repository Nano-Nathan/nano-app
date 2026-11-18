import type { NanoObject } from './objects';

/** How a message shows: `success` and `error` by its result, `info` and `warning` when the backend says so */
export type MessageType = 'success' | 'info' | 'warning' | 'error';

/** API response */
export type ApiResponse<T = any> = {
  status?: number;
  success?: boolean;
  result?: T;
  /** Total of a list, for a table to paginate */
  count?: number;
  message?: string;
  /** How its message shows; without it, by `success` */
  type?: MessageType;
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
