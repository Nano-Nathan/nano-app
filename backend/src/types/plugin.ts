import type { NanoObject, PluginCallbacks } from '@nano-app/core';

/** Database configuration */
export type DatabaseConfig = {
  /** Its schema */
  schema: NanoObject;
};

/** When a plugin is mounted, relative to the consumer routes */
export type PluginStage = 'before' | 'after';

/** Plugin configuration: a group of endpoints */
export type PluginConfig<Options = NanoObject> = {
  /** Name of the plugin, also the name of its database when it has one */
  name: string;
  /** Directory used to discover the `*.route.ts` files */
  routesDir: string;
  /** Base path prepended to every endpoint, e.g. "/auth" (no trailing slash). Defaults to none */
  basePath?: string;
  /** Schema of the plugin's database, mounted before its endpoints */
  database?: DatabaseConfig;
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
};
