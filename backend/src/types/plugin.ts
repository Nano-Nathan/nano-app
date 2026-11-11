import type { NanoObject, PluginCallbacks } from '@nano-app/core';
import type { DatabaseConfig } from './database';

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
  /** Mount point relative to the consumer routes. Defaults to "before" */
  stage?: PluginStage;
  /** Drizzle schema of the plugin's database, mounted before its endpoints */
  database?: DatabaseConfig;
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
};

/** The project's plugin: nano-app names it "app" and mounts it between the "before" and "after" plugins. `routesDir` defaults to "src/routes"; without `database` the app has none */
export type MainPluginConfig<Options = NanoObject> = Partial<
  Omit<PluginConfig<Options>, 'name' | 'stage'>
>;
