import type { Express } from "express";
import type { DatabaseConfig } from "./database";

/** When a plugin is mounted, relative to the consumer routes */
export type PluginStage = "before" | "after";

/** Plugin configuration: a group of endpoints */
export type PluginConfig = {
  /** Name of the plugin, same as his database (If have one) */
  name: string;
  /** Directory used to discover the `*.route.ts` files */
  routesDir: string;
  /** Base path prepended to every endpoint of the plugin. Defaults to "/" */
  basePath?: string;
  /** Mount point relative to the consumer routes. Defaults to "before" */
  stage?: PluginStage;
  /** Prisma client the plugin needs, mounted before its endpoints */
  database?: DatabaseConfig;
  /** Callback run first, before the endpoints are mounted */
  init?: (app: Express, db: any) => void | Promise<void>;
}

/** The project's plugin: nano-app names it "app" and mounts it between the "before" and "after" plugins */
export type MainPluginConfig = {
  /** Directory of the project's `*.route.ts` files. Defaults to "src/routes" */
  routesDir?: string;
  /** Base path prepended to every route. Defaults to "/" */
  basePath?: string;
  /** The project's database */
  database?: {
    /** Whether the database is enabled. Defaults to false */
    enabled?: boolean;
    /** Prisma schema file, relative to `cwd`. Defaults to "src/prisma/schema.prisma" */
    schemaPath?: string;
  };
  /** Callback run first, before the routes are mounted */
  init?: (app: Express, db: any) => void | Promise<void>;
}
