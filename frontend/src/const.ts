import { API_STORE_TYPE } from '@nano-app/core/const';

/** Type of a `*.store.ts` of UI state */
export const APP_STORE_TYPE = 'app';

/** Whether the code runs on the server, where Next renders each component once for the HTML */
export const IS_SERVER = typeof window === 'undefined';

/** Error of a component outside the provider */
export const MISSING_PROVIDER =
  'A component has no stores. Wrap the root layout with NanoAppProvider.';

/** Global that `compiler.defineServer` replaces with each api store and its URL's env var. Read as `NANO_APP_BACKENDS`, literal */
export const BACKENDS_DEFINE = 'NANO_APP_BACKENDS';

/** Class of each store type, in the file `withNanoApp` writes */
export const STORE_CLASSES = { [APP_STORE_TYPE]: 'Store', [API_STORE_TYPE]: 'ApiStore' };

/** File `withNanoApp` writes in the app with the type of each store */
export const TYPES_FILE = 'nano-app-env.d.ts';

/** Base path of the proxy: `/api/<store>/<path>` goes to the backend of the store */
export const PROXY_PATH = '/api';
