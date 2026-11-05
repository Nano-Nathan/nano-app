import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlugin } from '@nano-app/backend';

/** Automatic CRUD: reads any model of the app's database on `/api/<model>{/<id>}` */
export default createPlugin((options?: { basePath?: string }) => ({
  name: 'crud',
  basePath: options?.basePath ?? '/api',
  // After the app: it uses the app's database
  stage: 'after',
  // Next to this file, from the sources and from the build
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
}));
