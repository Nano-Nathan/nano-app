import { createPlugin } from '@nano-app/backend';
import route from './route';
import type { NanoObject } from '@nano-app/backend';
import type { CrudValidations } from '../types/crud';

/** Automatic CRUD: the tables of `models` of the app's database on `/<model>{/<id>}` */
export default createPlugin(
  (options?: { models: NanoObject; validations?: NanoObject<CrudValidations> }) => ({
    name: 'crud',
    // One route per table, by its name in the app's relations
    routes: Object.fromEntries(
      Object.entries(options?.models ?? {}).map(([sModel, oTable]) => [
        `/${sModel}`,
        route(sModel, oTable, options?.validations?.[sModel]),
      ]),
    ),
  }),
);
