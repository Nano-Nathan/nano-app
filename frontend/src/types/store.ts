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
  /** Base path of Better Auth in the backend of an `api` store (`/api/auth`) */
  auth?: string;
};

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<StoreFile>;

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** Stores of a React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file */
// any: each store is a `Store` or an `ApiStore` by its file, typed per name in typed-paths
export type Stores = NanoObject<any> & { [APP_NAME]: Store };
