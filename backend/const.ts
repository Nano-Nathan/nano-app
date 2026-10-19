/** Package of the official plugins: only its schemas may declare nano_* */
export const OFFICIAL_PLUGINS = '@nano-app/plugins';

/** Error when the database URL is missing, at startup and on `nano-app push` */
export const MISSING_DATABASE_URL =
  '[nano-app] [ERROR] The DATABASE_URL environment variable is not defined.';
