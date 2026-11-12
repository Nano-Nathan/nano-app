import Router from '../router/Router';
import BetterAuth from '../auth/BetterAuth';
import Database from '../database/Database';
import type { Express } from 'express';
import type { PluginConfig, PluginContext } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;
  private oDatabase?: Database;

  /** Creates a new Plugin instance */
  constructor(oConfig: PluginConfig) {
    const { name, database } = oConfig;
    this.oConfig = oConfig;
    this.oDatabase = database && new Database(name, database);
  }

  /** The Drizzle client of its own database, or undefined without one */
  // any: the client is typed by the schema of each app, unknown to the framework
  public client(): Promise<any> | undefined {
    return this.oDatabase?.client();
  }

  /** Mounts its endpoints on express app, with what the plugin manager gives it */
  public async mount(oApp: Express, { db, authOptions }: PluginContext = {}): Promise<void> {
    const { routesDir, basePath, database, options, callbacks } = this.oConfig;

    // Its own client; without one, the one it was given
    const oDb = (await this.client()) ?? db;

    // Better Auth on its client and schema: its endpoints, then the session of every request
    if (authOptions && database) {
      const { sPath, oHandler, fnSession } = await BetterAuth.create(
        authOptions,
        oDb,
        database.schema,
      );
      oApp.all(sPath, oHandler);
      oApp.use(fnSession);
    }

    // What every callback and handler receives, read-only
    const oParams = Object.freeze({ ...options, db: oDb, auth: BetterAuth.get() });

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(oApp, oParams);

    // Append the handlers
    const oRouter = new Router(routesDir, basePath);
    for (const { path, endpoint } of await oRouter.mount()) {
      oApp.all(path, await endpoint.mount(oParams, path));
    }
  }
}
