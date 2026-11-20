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

  /** Its middlewares and endpoints, in order, for NanoApp to register */
  public async build(oAppDB?: Drizzle): Promise<Mount[]> {
    const {
      name,
      routesDir,
      routes,
      middlewares = [],
      basePath,
      database,
      options,
      callbacks,
    } = this.oConfig;

    // The Drizzle client of its database; without one, the app's
    const oDB = database ? new Drizzle(name, database) : oAppDB;
    const db = await DatabaseManager.mount(oDB);

    // What every callback and handler receives, read-only: its client and its tables
    const oParams = Object.freeze({ ...options, db, relations: oDB?.oConfig.relations });

    // Its setup, before any of its endpoints
    await callbacks?.onMount?.(oParams);

    // Its middlewares, then its endpoints, the most specific path first
    const aMiddlewares = middlewares.map(handler => ({ handler }));
    const aRoutes = await new Router(routesDir, basePath, routes).load();
    const aEndpoints = await Promise.all(
      aRoutes.map(async ({ path, endpoint }) => ({
        path,
        handler: await endpoint.init(oParams),
      })),
    );
    return [...aMiddlewares, ...aEndpoints];
  }
}
