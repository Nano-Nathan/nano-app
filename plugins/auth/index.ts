import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlugin, createPluginCallbacks } from '@nano-app/backend';
import { ensureMaster, findKey } from './keys';
import type { AuthOptions } from '../types/auth';

/** Folder of this file, from the sources and from the build */
const DIR = dirname(fileURLToPath(import.meta.url));

/**
 * API keys: every route mounted after this plugin needs a valid `x-api-key`.
 * The master key, created on the first startup, manages the rest under `basePath`
 */
export default createPlugin((options?: AuthOptions) => {
  const { basePath = '/api-keys', publicPaths = [] } = options ?? {};

  return {
    name: 'auth',
    basePath,
    stage: 'before',
    routesDir: resolve(DIR, 'routes'),
    database: { enabled: true, schemaPath: resolve(DIR, 'schema.prisma') },
    callbacks: createPluginCallbacks({
      onMount: async (oApp, { db }) => {
        // Creates the master key on the first startup
        await ensureMaster(db);

        // Guard: a valid key, on this plugin's endpoints and on everything mounted after it
        oApp.use((oReq, _oRes, fnNext) => {
          // Public paths pass as they are
          if (publicPaths.includes(oReq.path)) return fnNext();

          // Looks up the key of the request
          findKey(db, oReq.get('x-api-key'))
            .then(oKey =>
              fnNext(oKey ? undefined : { status: 401, message: 'Invalid or missing API key' }),
            )
            .catch(fnNext);
        });
      },
    }),
  };
});
