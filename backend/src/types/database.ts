import type { NanoObject } from '@nano-app/core';

/** Database of a plugin or of the app */
export type DatabaseConfig = {
  /** Its Drizzle schema: the module of its tables, with its `relations` when it has them (`import * as schema from './db/schema'`) */
  schema: NanoObject;
};
