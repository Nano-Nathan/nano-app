import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlugin } from '@nano-app/backend';

/** Automatic CRUD: the listed models of the app's database on `/api/<model>{/<id>}` */
export default createPlugin((options?: { basePath?: string; models: string[] }) => ({
  name: 'crud',
  basePath: options?.basePath ?? '/api',
  // After the app: it uses the app's database
  stage: 'after',
  // Its routes read the published models from the options
  options,
  // Next to this file, from the sources and from the build
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), 'routes'),
}));
