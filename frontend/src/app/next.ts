import { writeFile } from 'node:fs/promises';
import FileLoader from '@nano-app/core/files/FileLoader';
import { API_STORE_TYPE, APP_NAME, STORES_DEFINE } from '@nano-app/core/const';
import { APP_STORE_TYPE, BACKENDS_DEFINE, STORE_CLASSES, TYPES_FILE } from '../const';
import { STORE } from '../utils/validations';
import type { NextConfig } from 'next';
import type { StoreFile } from '../types/store';

/**
 * Wraps the app's Next config: loads its stores while Next reads `next.config.ts`, before compiling.
 * Node only: never import it from the app's components.
 */
export function withNanoApp(oNextConfig: NextConfig = {}): () => Promise<NextConfig> {
  return async () => {
    // Finds and validates the app's `src/stores/**/*.store.ts`
    const oFiles = await FileLoader.findMany('store', STORE);

    // The app store is always there, empty when the app has no file for it
    const oApp: StoreFile = { type: APP_STORE_TYPE };

    // Pairs each with its name, its path with `_` for `/`
    const aStores = Object.entries({ [`/${APP_NAME}`]: oApp, ...oFiles }).map(
      ([sPath, oStore]): [string, StoreFile] => [sPath.slice(1).replaceAll('/', '_'), oStore],
    );

    // Pairs each api store with the env var of its backend URL, for the proxy
    const aBackends = aStores
      .filter(([, { type }]) => type === API_STORE_TYPE)
      .map(([sName]) => [sName, `API_${sName.toUpperCase()}_URL`]);

    // Writes the type of each store, for `stores.<name>` in the app
    const aTypes = aStores.map(
      ([sName, { type }]) =>
        `    ${JSON.stringify(sName)}: import('@nano-app/frontend').${STORE_CLASSES[type]};`,
    );
    await writeFile(
      TYPES_FILE,
      [
        '// Written by withNanoApp from src/stores. Do not edit.',
        'export {};',
        "declare module '@nano-app/frontend' {",
        '  interface Stores {',
        ...aTypes,
        '  }',
        '}',
        '',
      ].join('\n'),
    );

    // Writes the stores in every bundle and the backends only in the server's, as JSON
    const { compiler } = oNextConfig;
    return {
      ...oNextConfig,
      compiler: {
        ...compiler,
        define: { ...compiler?.define, [STORES_DEFINE]: JSON.stringify(aStores) },
        defineServer: { ...compiler?.defineServer, [BACKENDS_DEFINE]: JSON.stringify(aBackends) },
      },
    };
  };
}
