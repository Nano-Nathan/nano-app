import type { API_STORE_TYPE, APP_NAME, APP_STORE_TYPE } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<{
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
  /** Headers the proxy adds, by name: each value names its env var (`STRIPE_KEY` → `API_STRIPE_KEY_HEADER`) */
  headers?: NanoObject<string>;
}>;

/** Stores of one React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file; `app` is always there */
// any: each store is a `Store` or an `ApiStore` by its file, typed per name in typed-paths
export type Stores = NanoObject<any> & { [APP_NAME]: Store };

/** State of an `ApiStore`: requests in progress, results per path and query, and versions per entity */
export type ApiState = {
  iBusy: number;
  oResults: NanoObject<{ iVersion: number; result: unknown }>;
  oVersions: NanoObject<number>;
};
