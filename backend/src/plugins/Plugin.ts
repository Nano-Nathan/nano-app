import Router from '../router/Router';
import BetterAuth from '../auth/BetterAuth';
import Database from '../database/Database';
import type { Express } from 'express';
import type { PluginConfig } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;
  private oDatabase: Database;

  /** Creates a new Plugin instance, with its database */
  constructor(oConfig: PluginConfig) {
    this.oConfig = oConfig;
    this.oDatabase = new Database(oConfig.name, oConfig.database);
  }

  /** Mounts its endpoints on express app */
  public async mount(oApp: Express): Promise<void> {
    const { routesDir, basePath, options, callbacks } = this.oConfig;

    // Its Drizzle client, when it has a database
    const oDb = await this.oDatabase.client();

    // What every callback and handler receives, read-only
    const oParams = Object.freeze({ ...options, db: oDb, auth: BetterAuth.instance() });

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(oApp, oParams);

    // Append the handlers
    const oRouter = new Router(routesDir, basePath);
    for (const { path, endpoint } of await oRouter.mount()) {
      oApp.all(path, await endpoint.mount(oParams, path));
    }
  }
}
