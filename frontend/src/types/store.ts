import type { NanoObject } from '@nano-app/core/types/objects';

/** `*.store.ts` of UI state */
export type AppStoreFile = {
  type: 'app';
  /** Initial state */
  data?: NanoObject;
};

/** Default export of a `*.store.ts` */
export type StoreFile = AppStoreFile;

/** Stores of the app by name (`src/stores/app.store.ts` → `app`) */
export type StoreFiles = Record<string, StoreFile>;
