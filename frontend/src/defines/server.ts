// Values `withNanoApp` writes with `compiler.defineServer`: they reach only the server bundles.
// Each name stays literal so Next can replace it

/** Each api store and its URL's env var as JSON */
declare const NANO_APP_BACKENDS: string;

/** Each api store and the env var of its backend URL (`admin_users` → `API_ADMIN_USERS_URL`) */
const BACKENDS: [string, string][] = JSON.parse(NANO_APP_BACKENDS);

/** Backend URL of each api store, read from the env once */
export const URLS = new Map(BACKENDS.map(([sName, sEnvName]) => [sName, process.env[sEnvName]]));

/** Env vars of the api stores that are not defined */
export const MISSING_ENVS = BACKENDS.filter(([, sEnvName]) => !process.env[sEnvName]).map(
  ([, sEnvName]) => sEnvName,
);
