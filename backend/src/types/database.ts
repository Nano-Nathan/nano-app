import type { NanoObject } from '@nano-app/core';

/** Database of a plugin or of the app */
export type DatabaseConfig = {
  /** Its Drizzle schema: the module of its tables and `relations` */
  schema: NanoObject;
  /** Applies the schema at startup with drizzle-kit's push, failing on data loss. Defaults to false */
  push?: boolean;
  /** Folder of the migrations `drizzle-kit generate` writes, applied at startup */
  migrations?: string;
};
