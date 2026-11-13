/** Name of the app: the backend's main plugin and the frontend's store of UI state, always present */
export const APP_NAME = 'app';

/** Type of a `*.store.ts` that reads and writes a backend, through the frontend proxy */
export const API_STORE_TYPE = 'api';

/** Env var that carries the stores to the bundle. Read as `process.env.NANO_APP_STORES`, literal */
export const STORES_ENV = 'NANO_APP_STORES';

/** Message of a failed request whose answer brings none */
export const REQUEST_FAILED = 'Request failed';

/** Store the components use when none is named: the proxy serves it on `/api` itself */
export const DEFAULT_STORE = 'api';

/** Base path of Better Auth in the backend, and of an api store's `auth` */
export const AUTH_PATH = '/auth';
