import type { APP_STORE_TYPE } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core/types/objects';

/** `*.store.ts` of UI state */
export type AppStoreFile = {
  type: typeof APP_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
};

/** Default export of a `*.store.ts` */
export type StoreFile = AppStoreFile;

/** Stores of the app by name (`src/stores/app.store.ts` → `app`) */
export type StoreFiles = Record<string, StoreFile>;
