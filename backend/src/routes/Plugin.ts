import Router from './Router';
import BetterAuth from '../auth/BetterAuth';
import Database from '../database/Database';
import type { Express } from 'express';
import type { PackagesConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;
  private oAuthOptions: PackagesConfig['betterAuth'];

  /** Creates a new Plugin instance; the app's plugin also gets the Better Auth options */
  constructor(oConfig: PluginConfig, oAuthOptions?: PackagesConfig['betterAuth']) {
    this.oConfig = oConfig;
    this.oAuthOptions = oAuthOptions;
  }

  /** Mounts its endpoints on express app */
  public async mount(oApp: Express): Promise<void> {
    const { name, routesDir, basePath, database, options, callbacks } = this.oConfig;

    // Mounts the Prisma client, named as the plugin
    const oDb = database?.enabled ? await Database.mount(name, database) : undefined;

    // Every callback and handler receives the plugin's options and client
    const oParams = { ...options, db: oDb };

    // Better Auth: its endpoints stay public, its guard covers everything mounted after them
    if (this.oAuthOptions) {
      // Checks that the database is mounted: Better Auth keeps its tables there
      if (!oDb) {
        throw new Error(
          '[nano-app] [ERROR] packages.betterAuth needs the database of the app: set mainPlugin.database.enabled to true.',
        );
      }

      const { sPath, oHandler, fnGuard } = await BetterAuth.create(this.oAuthOptions, oDb);
      oApp.all(sPath, oHandler);
      oApp.use(fnGuard);
      console.log(`[nano-app] [INFO] ${sPath}`);
    }

    // Plugin setup with the app, before any of its endpoints
    await callbacks?.onMount?.(oApp, oParams);

    // Append the handlers
    const oRouter = new Router(routesDir, basePath);
    for (const { path, endpoint } of await oRouter.mount()) {
      oApp.all(path, await endpoint.mount(oParams));
    }
  }
}
