import Router from './Router';
import Database from '../database/Database';
import type { Express } from 'express';
import type { PluginConfig } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;

  /** Creates a new Plugin instance */
  constructor(oConfig: PluginConfig) {
    this.oConfig = oConfig;
  }

  /** Mounts its endpoints on express app */
  public async mount(oApp: Express): Promise<void> {
    const { name, routesDir, basePath, database, options, callbacks } = this.oConfig;

    // Mounts the Prisma client, named as the plugin
    const oDb = database?.enabled ? await Database.mount(name, database) : undefined;

    // Every callback and handler receives the plugin's options and client
    const oParams = { ...options, db: oDb };

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(oApp, oParams);

    // Append the handlers
    const oRouter = new Router(routesDir, basePath);
    for (const { path, endpoint } of await oRouter.mount()) {
      oApp.all(path, await endpoint.mount(oParams));
    }
  }
}
