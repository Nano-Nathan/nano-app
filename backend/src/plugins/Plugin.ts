import { Logger } from '@nano-app/core';
import Router from '../router/Router';
import DatabaseManager from '../database/DatabaseManager';
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

    // The Drizzle client of its database; without one, the app's
    const oDb = await DatabaseManager.mount(name, database);

    // What every callback and handler receives, read-only
    const oParams = Object.freeze({ ...options, db: oDb });

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(oApp, oParams);

    // Append the handlers
    const oRouter = new Router(routesDir, basePath);
    for (const { path, endpoint } of await oRouter.mount()) {
      Logger.info(path);
      oApp.all(path, await endpoint.mount(oParams, path));
    }
  }
}
