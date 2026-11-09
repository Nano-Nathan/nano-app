import { Formatter } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import Router from './Router';
import BetterAuth from '../auth/BetterAuth';
import Database from '../database/Database';
import type { Express } from 'express';
import type { AuthOptions } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** A group of routes, with its options, callbacks and database */
export default class Plugin {
  private oConfig: PluginConfig;
  private oAuthOptions?: AuthOptions;

  /** Creates a new Plugin instance; the app's plugin also gets the Better Auth options */
  constructor(oConfig: PluginConfig, oAuthOptions?: AuthOptions) {
    this.oConfig = oConfig;
    this.oAuthOptions = oAuthOptions;
  }

  /** Mounts its endpoints on express app */
  public async mount(oApp: Express): Promise<void> {
    const { name, routesDir, basePath, database, options, callbacks } = this.oConfig;

    // Mounts the Prisma client, named as the plugin; without its own, the app's
    const oDb = database?.enabled ? await Database.mount(name, database) : Database.get(APP_NAME);

    // Better Auth: its endpoints stay public; past them, every request carries its session, if any
    if (this.oAuthOptions) {
      // Checks that the database is mounted: Better Auth keeps its tables there
      if (!oDb) {
        throw new Error(
          Formatter.message(
            'ERROR',
            'src/auth.ts needs the database of the app: set mainPlugin.database.enabled to true.',
          ),
        );
      }

      const { sPath, oHandler, fnSession } = await BetterAuth.create(this.oAuthOptions, oDb);
      oApp.all(sPath, oHandler);
      oApp.use(fnSession);
    }

    // Every callback and handler receives, read-only, the plugin's options, client and Better Auth
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
