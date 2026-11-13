import type { QueryKey } from '@tanstack/query-core';
import type { ApiResponse } from '@nano-app/core/types/api';

/** Options of `collection` */
export type CollectionOptions = {
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  limit: number;
  /** Name of the api store it reads (`api` by default) */
  store?: string;
};

/** What the pages of a collection read and where they keep it */
export type PagesConfig = {
  /** Key of the pages in the cache */
  key: QueryKey;
  /** Items per page: a page with fewer is the last one */
  limit?: number;
  /** Reads the page that starts at an item */
  read: (offset: number) => Promise<ApiResponse>;
  /** Keeps every page read in one answer */
  keep: (response: ApiResponse) => void;
};
