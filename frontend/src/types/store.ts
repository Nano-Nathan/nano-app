import type { QueryKey } from '@tanstack/query-core';
import type { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';
import type { APP_STORE_TYPE } from '../const';

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** What the pages of a list read and where they keep it */
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

/** Stores of a React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file */
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

/** Where the proxy sends a request of a store: its backend, or the env var the store misses */
export type ProxyTarget = { url: string; headers: Headers } | { store: string; missing: string };

/** A store as its file exports it */
export type StoreFile = {
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
  /** Headers the proxy adds, each value names its env var: `KEY` → `API_KEY_HEADER` */
  headers?: NanoObject<string>;
  /** Better Auth in the backend of an `api` store */
  auth?: StoreAuth;
};

/** Better Auth of an `api` store: its base path and the pages it guards */
type StoreAuth = {
  /** Base path of Better Auth in the backend (`/api/auth`) */
  path: string;
  /** Pages that need a session; the rest are public */
  routes?: AuthRoute[];
};

/** A page that needs a session, and where it goes without one */
type AuthRoute = {
  /** Path of the page: exact (`/admin`), or it and all below it (`/admin/*`) */
  match: string;
  /** Page it goes to when the request is not allowed (`/` by default) */
  redirect?: string;
  /** Roles of the admin plugin, any of them allows it (`admin,editor`) */
  roles?: string;
  /** Actions per resource of the admin plugin, all of them needed (`{ collections: 'read,update' }`) */
  permissions?: NanoObject<string>;
};

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<StoreFile>;
