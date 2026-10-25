// Global

/** Name of the app: the backend's main plugin and the frontend's store of UI state, always present */
export const APP_NAME = 'app';

/** Type of a `*.store.ts` of UI state */
export const APP_STORE_TYPE = 'app';

/** Type of a `*.store.ts` that reads and writes a backend, through the frontend proxy */
export const API_STORE_TYPE = 'api';

/** HTTP methods a route can handle */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'QUERY'] as const;

// Backend

/** Package of the official plugins: only its schemas may declare nano_* */
export const OFFICIAL_PLUGINS = '@nano-app/plugins';

/** Error when the database URL is missing at startup */
export const MISSING_DATABASE_URL =
  '[nano-app] [ERROR] The DATABASE_URL environment variable is not defined.';

// Frontend

/** Whether the code runs on the server, where Next renders each component once for the HTML */
export const IS_SERVER = typeof window === 'undefined';

/** Env var that carries the stores to the bundle. Read as `process.env.NANO_APP_STORES`, literal */
export const STORES_ENV = 'NANO_APP_STORES';

/** Message of a failed request whose answer brings none */
export const REQUEST_FAILED = 'Request failed';

/** Error of a component outside the provider */
export const MISSING_PROVIDER =
  '[nano-app] [ERROR] A component has no stores. Wrap the root layout with NanoAppProvider.';
