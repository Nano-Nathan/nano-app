import type { ApiResponse } from '@nano-app/core/types/api';

/** Options of `list` */
export type ListOptions = {
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  top: number;
  /** Name of the api store it reads (`api` by default) */
  store?: string;
};

/** Methods a `list` gives its view; the page (`/list/page`) and the order (`/list/orderby`) are read from its api store */
export type ListMethods = {
  /** Reads the current page from the backend */
  load(): Promise<ApiResponse | undefined>;
  /** `ApiResponse` kept for the current page, `undefined` until it is read */
  items(): ApiResponse | undefined;
  /** Goes to the next page and reads it */
  next(): Promise<ApiResponse | undefined>;
  /** Goes to the previous page and reads it; stays on the first */
  prev(): Promise<ApiResponse | undefined>;
  /** Orders by a field, ascending and descending when it was already ascending, and reads the first page */
  sort(field: string): Promise<ApiResponse | undefined>;
};
