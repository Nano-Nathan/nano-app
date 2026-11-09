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

/** Loopback and private networks: the proxies the backend trusts by default */
export const PRIVATE_NETWORKS = [
  '127.0.0.0/8',
  '::1/128',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  'fc00::/7',
];

// Frontend

/** Whether the code runs on the server, where Next renders each component once for the HTML */
export const IS_SERVER = typeof window === 'undefined';

/** Env var that carries the stores to the bundle. Read as `process.env.NANO_APP_STORES`, literal */
export const STORES_ENV = 'NANO_APP_STORES';

/** Page a guarded route goes to when its `redirect` is not set */
export const DEFAULT_REDIRECT = '/';

/** Message of a failed request whose answer brings none */
export const REQUEST_FAILED = 'Request failed';

/** Error of a component outside the provider */
export const MISSING_PROVIDER =
  'A component has no stores. Wrap the root layout with NanoAppProvider.';
