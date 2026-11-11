import FileLoader from '@nano-app/core/files/FileLoader';
import Validator from '@nano-app/core/utils/Validator';
import { STORE } from '@nano-app/core/utils/validations';
import { STORES_ENV } from '@nano-app/core/const';
import type { NextConfig } from 'next';

/** Security headers of every page */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling,
 * and adds the security headers of every page.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    // Finds, names and validates the app's `src/stores/**/*.store.ts`
    const oFiles = await FileLoader.findMany('store');
    const oStores = Validator.validate(oFiles, STORE);

    // Inlines them in the bundle as JSON: the browser reads no file
    return {
      // Hides `X-Powered-By` unless the app sets it
      poweredByHeader: false,
      ...oNextConfig,
      env: { ...oNextConfig.env, [STORES_ENV]: JSON.stringify(oStores) },
      // Adds the security headers before the app's own: a header of the app with the same name wins
      headers: async () => [
        { source: '/:path*', headers: SECURITY_HEADERS },
        ...((await oNextConfig.headers?.()) ?? []),
      ],
    };
  };
}
