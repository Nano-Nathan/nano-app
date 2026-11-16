import FileLoader from '@nano-app/core/files/FileLoader';
import { STORES_ENV } from '@nano-app/core/const';
import { STORE } from './utils/validations';
import type { NextConfig } from 'next';

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    // Finds and validates the app's `src/stores/**/*.store.ts`
    const oFiles = await FileLoader.findMany('store', STORE);

    // Names each by its path, `_` for `/`
    const oStores = Object.fromEntries(
      Object.entries(oFiles).map(([sPath, oStore]) => [
        sPath.slice(1).replaceAll('/', '_'),
        oStore,
      ]),
    );

    // Inlines them in the bundle as JSON: the browser reads no file
    return {
      ...oNextConfig,
      env: { ...oNextConfig.env, [STORES_ENV]: JSON.stringify(oStores) },
    };
  };
}
