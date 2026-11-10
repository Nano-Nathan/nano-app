import type { QueryKey } from '@tanstack/query-core';
import type { APP_NAME } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** Options of `update` and `delete` of an api store */
export type WriteOptions = {
  /** Shows the write before its answer, and undoes it when it fails */
  optimistic?: boolean;
};

/** What the pages of a list read and where they keep it */
export type PagesConfig = {
  /** Key of the pages in the cache */
  key: QueryKey;
  /** Items per page: a page with fewer is the last one */
  top?: number;
  /** Reads the page that starts at an item */
  read: (skip: number) => Promise<ApiResponse>;
  /** Keeps every page read in one answer */
  keep: (response: ApiResponse) => void;
};

/** Stores of a React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file */
// any: each store is a `Store` or an `ApiStore` by its file
export type Stores = NanoObject<any> & { [APP_NAME]: Store };

/** A route of `auth.routes` as the proxy keeps it, ready to ask Better Auth */
export type GuardedRoute = {
  /** `/api/<store><auth.path>`: Better Auth through the proxy */
  authPath: string;
  match: string;
  redirect: string;
  /** Roles of the admin plugin; empty without any */
  roles: Set<string>;
  /** Actions per resource, as Better Auth's `has-permission` takes them */
  permissions?: NanoObject<string[]>;
};
