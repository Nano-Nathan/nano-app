// Global

/** Name of the app: the backend's main plugin and the frontend's store of UI state, always present */
export const APP_NAME = 'app';

/** Type of a `*.store.ts` of UI state */
export const APP_STORE_TYPE = 'app';

// Backend

/** Package of the official plugins: only its schemas may declare nano_* */
export const OFFICIAL_PLUGINS = '@nano-app/plugins';

/** Error when the database URL is missing, at startup and on `nano-app push` */
export const MISSING_DATABASE_URL =
  '[nano-app] [ERROR] The DATABASE_URL environment variable is not defined.';

// Frontend

/** Env var that carries the stores to the bundle. Read as `process.env.NANO_APP_STORES`, literal */
export const STORES_ENV = 'NANO_APP_STORES';
