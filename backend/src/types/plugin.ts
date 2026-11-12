import type { NanoObject, PluginCallbacks } from '@nano-app/core';
import type { AuthOptions } from './app';

/** Database configuration */
export type DatabaseConfig = {
  /** Its schema */
  schema: NanoObject;
  /** Applies the schema at startup with drizzle-kit's push, failing on data loss. Defaults to false */
  push?: boolean;
};

export type PluginManagerConfig = {
  /** Directory used to discover the `*.route.ts` files */
  routesDir: string;
  /** Schema of the plugin's database, mounted before its endpoints */
  database?: DatabaseConfig;
  /** Plugins to mount before the app */
  plugins_before?: PluginConfig[];
  /** Plugins to mount after the app */
  plugins_after?: PluginConfig[];
  /** Better Auth options: with them, the app's routes need a session */
  auth?: AuthOptions;
};

/** Plugin configuration: a group of endpoints */
export type PluginConfig<Options = NanoObject> = {
  /** Name of the plugin, also the name of its database when it has one */
  name: string;
  /** Base path prepended to every endpoint, e.g. "/auth" (no trailing slash). Defaults to none */
  basePath?: string;
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
} & Omit<PluginManagerConfig, 'plugins_before' | 'plugins_after' | 'auth'>;