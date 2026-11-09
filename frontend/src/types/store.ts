import type { APP_NAME } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
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
