import type { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import type { ApiResponse, MessageType } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type ApiStore from '../stores/ApiStore';
import type Store from '../stores/Store';
import type { API_NAME, APP_STORE_TYPE } from '../const';

/** An answer with a message, or a failed one, in the `/message/list` of its api store, and when it came */
export type ApiMessage = ApiResponse & {
  /** How it shows: the backend's, or `success` or `error` by its result */
  type: MessageType;
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
};

/** Stores of a React tree by name: `app` and `api` always, the others from the `nano-app-env.d.ts` of `withNanoApp` */
export interface Stores {
  [APP_NAME]: Store;
  [API_NAME]: ApiStore;
}

/** A store as its file exports it */
export type StoreFile = {
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
};
