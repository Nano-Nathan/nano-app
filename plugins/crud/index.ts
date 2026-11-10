import { join } from 'node:path';
import { createPlugin } from '@nano-app/backend';
import type { NanoObject } from '@nano-app/backend';
import type { CrudSchemas } from '../types/crud';

/** Automatic CRUD: the listed tables of the app's schema on `/api/<model>{/<id>}` */
export default createPlugin(
  (options?: {
    basePath?: string;
    models: string[];
    schema: NanoObject;
    schemas?: NanoObject<CrudSchemas>;
  }) => ({
    name: 'crud',
    basePath: options?.basePath ?? '/api',
    // After the app: it uses the app's database
    stage: 'after',
    // Next to this file, from the sources and from the build
    routesDir: join(import.meta.dirname, 'routes'),
    // Its routes read the published tables, the app's schema and its zod schemas from the options
    options,
  }),
);
