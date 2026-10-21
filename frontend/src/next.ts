import FileLoader from '@nano-app/core/loader/FileLoader';
import { STORES_ENV } from '@nano-app/core/const';
import type { NextConfig } from 'next';

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    // Finds, names and validates the app's `src/stores/**/*.store.ts`
    const oStores = await FileLoader.findMany({ extension: 'store' });

    // Inlines them in the bundle as JSON: the browser reads no file
    return {
      ...oNextConfig,
      env: { ...oNextConfig.env, [STORES_ENV]: JSON.stringify(oStores) },
    };
  };
}
