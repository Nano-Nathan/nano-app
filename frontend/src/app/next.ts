import FileLoader from '@nano-app/core/files/FileLoader';
import { STORES_DEFINE } from '@nano-app/core/const';
import { STORE } from '../utils/validations';
import type { NextConfig } from 'next';

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    // Finds and validates the app's `src/stores/**/*.store.ts`
    const oFiles = await FileLoader.findMany('store', STORE);

    // Pairs each with its name, its path with `_` for `/`
    const aStores = Object.entries(oFiles).map(([sPath, oStore]) => [
      sPath.slice(1).replaceAll('/', '_'),
      oStore,
    ]);

    // Writes them in every bundle as JSON: the browser reads no file
    const { compiler } = oNextConfig;
    return {
      ...oNextConfig,
      compiler: {
        ...compiler,
        define: { ...compiler?.define, [STORES_DEFINE]: JSON.stringify(aStores) },
      },
    };
  };
}
