import { Router } from "./Router";
import { Database } from "../database/Database";
import type { PluginConfig } from "../types/plugin";
import type { Express } from "express";

export class Plugin {
  private config: PluginConfig;

  /** Creates a new Plugin instance */
  constructor(config: PluginConfig) {
    this.config = config;
  }

  /** Mounts its endpoints on express app */
  async mount(app: Express): Promise<void> {
    const { name, routesDir, basePath, database, options, callbacks } = this.config;

    const router = new Router(routesDir, basePath);

    // Mount the Prisma client, named as the plugin
    const db = database?.enabled ? await Database.mount(name, database) : undefined

    // Every callback and handler receives the plugin's options and client
    const params = { ...options, db };

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(app, params);

    // Append the handlers
    for (const { path, endpoint } of await router.mount()) app.all(path, await endpoint.mount(params));
  }
}
