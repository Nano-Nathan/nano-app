import { join } from 'node:path';
import { createPlugin } from '@nano-app/backend';
import type { NanoObject } from '@nano-app/backend';
import type { CrudValidations } from '../types/crud';

/** Automatic CRUD: the listed tables of the app's database on `/api/<model>{/<id>}` */
export default createPlugin(
  (options?: {
    basePath?: string;
    models: string[];
    dbSchema: NanoObject;
    validations?: NanoObject<CrudValidations>;
  }) => ({
    name: 'crud',
    basePath: options?.basePath ?? '/api',
    // After the app: it uses the app's database
    stage: 'after',
    // Next to this file, from the sources and from the build
    routesDir: join(import.meta.dirname, 'routes'),
    // Its routes read them from the options
    options,
  }),
);
