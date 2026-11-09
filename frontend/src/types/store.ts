import type { API_STORE_TYPE, APP_NAME, APP_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

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
export type StoreAuth = {
  /** Base path of Better Auth in the backend (`/api/auth`) */
  path: string;
  /** Pages that need a session; the rest are public */
  routes?: AuthRoute[];
};

/** A page that needs a session, and where it goes without one */
export type AuthRoute = {
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

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** Stores of a React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file */
// any: each store is a `Store` or an `ApiStore` by its file
export type Stores = NanoObject<any> & { [APP_NAME]: Store };

/** Options of an api store with Better Auth */
export type AuthStoreOptions = {
  /** Base path of Better Auth in the backend */
  path: string;
  /** Initial state */
  data?: NanoObject;
  /** Refreshes the page, for the proxy to guard it again */
  refresh: () => void;
};

/** A route of `auth.routes` as the proxy keeps it: with its store, and its roles and actions as lists */
export type GuardedRoute = {
  /** Name of the store with the `auth` of the route */
  store: string;
  /** Base path of Better Auth in the backend of the store */
  path: string;
  match: string;
  redirect: string;
  roles?: string[];
  permissions?: NanoObject<string[]>;
};
