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

/** The project's plugin: nano-app names it "app" and mounts it between the "before" and "after" plugins */
export type MainPluginConfig<Options = NanoObject> = {
  /** Directory of the project's `*.route.ts` files. Defaults to "src/routes" */
  routesDir?: string;
  /** Base path prepended to every route, e.g. "/api" (no trailing slash). Defaults to none */
  basePath?: string;
  /** Drizzle schema of the project's database; without it the app has none */
  database?: DatabaseConfig;
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
};
