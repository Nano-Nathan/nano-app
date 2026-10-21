import type { APP_NAME, APP_STORE_TYPE } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Store from '../stores/Store';

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<{
  type: typeof APP_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
}>;

/** Stores of one React tree by name; `app` is always there */
export type Stores = NanoObject<Store> & { [APP_NAME]: Store };
