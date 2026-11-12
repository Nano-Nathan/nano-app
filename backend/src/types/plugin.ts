import type { NanoObject, PluginCallbacks } from '@nano-app/core';
import type { DatabaseConfig } from './database';

/** Plugin configuration: a group of endpoints */
export type PluginConfig<Options = NanoObject> = {
  /** Name of the plugin, also the name of its database when it has one */
  name: string;
  /** Directory used to discover the `*.route.ts` files */
  routesDir: string;
  /** Base path prepended to every endpoint, e.g. "/auth" (no trailing slash). Defaults to none */
  basePath?: string;
  /** Drizzle schema of the plugin's database, mounted before its endpoints */
  database?: DatabaseConfig;
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
};

/** What PluginManager reads: the app's plugin and the ones around it */
export type PluginManagerConfig = {
  /** Folder of the app's routes. Defaults to "src/routes" */
  routesDir?: string;
  /** Drizzle schema of the app's database */
  database?: DatabaseConfig;
  /** Plugins mounted before and after the app's routes */
  plugins?: {
    /** Before the app's routes */
    before?: PluginConfig[];
    /** After the app's routes */
    after?: PluginConfig[];
  };
};
