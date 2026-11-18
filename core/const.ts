/** Name of the app: the backend's main plugin and the frontend's store of UI state, always present */
export const APP_NAME = 'app';

/** Type of a `*.store.ts` that reads and writes a backend, through the frontend proxy */
export const API_STORE_TYPE = 'api';

/** Global that `compiler.define` replaces with the stores in the bundle. Read as `NANO_APP_STORES`, literal */
export const STORES_DEFINE = 'NANO_APP_STORES';

/** Message of a failed request whose answer brings none */
export const REQUEST_FAILED = 'nano.error.requestFailed';

/** Base path of Better Auth in the backend */
export const AUTH_PATH = '/auth';
