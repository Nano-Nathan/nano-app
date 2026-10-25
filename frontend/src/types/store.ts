import type { API_STORE_TYPE, APP_NAME, APP_STORE_TYPE } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<{
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
  /** Headers the proxy adds, each value names its env var: `KEY` → `API_KEY_HEADER` */
  headers?: NanoObject<string>;
}>;

/** A failed request in the `/error/list` of its api store */
export type ApiError = {
  /** Message of the backend, or `Request failed` when it brings none */
  message: string;
  /** Whether the backend marked it as a warning */
  warning?: boolean;
};

/** Stores of a React tree by name: a `Store` per `app` file, an `ApiStore` per `api` file */
// any: each store is a `Store` or an `ApiStore` by its file, typed per name in typed-paths
export type Stores = NanoObject<any> & { [APP_NAME]: Store };
