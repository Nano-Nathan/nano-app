/** Type of a `*.store.ts` of UI state */
export const APP_STORE_TYPE = 'app';

/** Whether the code runs on the server, where Next renders each component once for the HTML */
export const IS_SERVER = typeof window === 'undefined';

/** Error of a component outside the provider */
export const MISSING_PROVIDER =
  'A component has no stores. Wrap the root layout with NanoAppProvider.';

/** Security headers of every page */
export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/** Base path of the proxy: `/api/<store>/<path>` goes to the backend of the store */
export const PROXY_PATH = '/api';
