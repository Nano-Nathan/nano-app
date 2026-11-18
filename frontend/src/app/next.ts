import { STORES_DEFINE } from '@nano-app/core/const';
import { BACKENDS_DEFINE } from '../const';
import NextBuild from './NextBuild';
import type { NextConfig } from 'next';

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    const aStores = await NextBuild.stores();
    await NextBuild.writeTypes(aStores);

    // Writes the stores in every bundle and the backends only in the server's, as JSON
    const { compiler } = oNextConfig;
    return {
      ...oNextConfig,
      compiler: {
        ...compiler,
        define: { ...compiler?.define, [STORES_DEFINE]: JSON.stringify(aStores) },
        defineServer: {
          ...compiler?.defineServer,
          [BACKENDS_DEFINE]: JSON.stringify(NextBuild.backends(aStores)),
        },
      },
    };
  };
}
