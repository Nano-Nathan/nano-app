import type { API_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { APP_STORE_TYPE } from '../const';

/** A failed request in the `/error/list` of its api store: its `ApiResponse` and when it failed */
export type ApiError = ApiResponse & {
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** Stores of a React tree by name, filled by the `nano-app-env.d.ts` that `withNanoApp` writes */
export interface Stores {}

/** A store as its file exports it */
export type StoreFile = {
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
};
