import type { NanoObject } from '@nano-app/core';

/** Database of a plugin or of the app */
export type DatabaseConfig = {
  /** Its schema */
  schema: NanoObject;
};
