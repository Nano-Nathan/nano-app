import type { NanoObject } from '@nano-app/core';

/** Database of a plugin or of the app */
export type DatabaseConfig = {
  /** Its Drizzle schema: the module of its tables and `relations` */
  schema: NanoObject;
};
