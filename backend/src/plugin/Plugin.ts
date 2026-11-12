import { NanoError } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import Router from './Router';
import BetterAuth from '../auth/BetterAuth';
import Database from '../plugin/Database';
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

    // Better Auth is on for the app's plugin, when the app has src/auth.ts
    const oAuthOptions = name === APP_NAME ? await BetterAuth.findOptions() : undefined;

    // Mounts the Drizzle client, named as the plugin; without its own, the app's
    const oDb = database ? await Database.mount(name, database) : Database.get(APP_NAME);

    // Better Auth: its endpoints, then the session of every request
    if (oAuthOptions) {
      // Better Auth keeps its tables in the app's database
      if (!database) {
        throw new NanoError(
          'src/auth.ts needs the database of the app: set database.schema in createNanoApp.',
        );
      }

      const { sPath, oHandler, fnSession } = await BetterAuth.create(
        oAuthOptions,
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
