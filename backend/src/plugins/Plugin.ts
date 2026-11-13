import Router from '../router/Router';
import DatabaseManager from '../database/DatabaseManager';
import Drizzle from '../database/clients/Drizzle';
import type { Mount } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;

  /** Creates a new Plugin instance */
  constructor(oConfig: PluginConfig) {
    this.oConfig = oConfig;
  }

  /** Its endpoints, the most specific path first, for NanoApp to register */
  public async build(): Promise<Mount[]> {
    const { name, routesDir, basePath, database, options, callbacks } = this.oConfig;

    // The Drizzle client of its database; without one, the app's
    const oDb = await DatabaseManager.mount(database && new Drizzle(name, database));

    // What every callback and handler receives, read-only
    const oParams = Object.freeze({ ...options, db: oDb });

    // Its setup, before any of its endpoints
    await callbacks?.onMount?.(oParams);

    // Its endpoints, the most specific path first
    const aRoutes = await new Router(routesDir, basePath).load();
    return Promise.all(
      aRoutes.map(async ({ path, endpoint }) => ({
        path,
        handler: await endpoint.init(oParams, path),
      })),
    );
  }
}
