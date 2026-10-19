import type { DatabaseConfig } from './database';
import type { NanoObject, PluginCallbacks } from '@nano-app/core';

/** When a plugin is mounted, relative to the consumer routes */
export type PluginStage = 'before' | 'after';

/** Plugin configuration: a group of endpoints */
export type PluginConfig<Options = NanoObject> = {
  /** Name of the plugin, same as his database (If have one) */
  name: string;
  /** Directory used to discover the `*.route.ts` files */
  routesDir: string;
  /** Base path prepended to every endpoint, e.g. "/auth" (no trailing slash). Defaults to none */
  basePath?: string;
  /** Mount point relative to the consumer routes. Defaults to "before" */
  stage?: PluginStage;
  /** Prisma client the plugin needs, mounted before its endpoints */
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
  /** The project's database */
  database?: {
    /** Whether the database is enabled. Defaults to false */
    enabled?: boolean;
    /** Prisma schema file, relative to `cwd`. Defaults to "src/prisma/schema.prisma" */
    schemaPath?: string;
  };
  /** Plugin options */
  options?: Options;
  /** Plugin callbacks */
  callbacks?: PluginCallbacks;
};
