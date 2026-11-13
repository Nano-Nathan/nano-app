import express, { type Express } from 'express';
import 'dotenv/config';
import { Logger } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import PluginManager from '../plugins/PluginManager';
import Auth from '../auth/Auth';
import DatabaseManager from '../database/DatabaseManager';
import Drizzle from '../database/clients/Drizzle';
import { PACKAGES, PORT, SETTINGS } from './config';
import { errorHandler, notFoundHandler } from './handlers/errors';
import packages from './packages';
import type { NanoAppConfig } from '../types/app';

/** Main NanoApp class */
export default class NanoApp {
  protected oApp: Express;
  protected oConfig: NanoAppConfig;

  constructor(oConfig: NanoAppConfig = {}) {
    this.oApp = express();
    this.oConfig = oConfig;
    this.start();
  }

  /** Starts the application */
  private async start(): Promise<void> {
    try {
      await this.initialize();

      // Init server
      const iPort = this.oConfig.port ?? PORT;
      this.oApp.listen(iPort, () => {
        // Runs the consumer listener
        this.oConfig.listener?.();

        // Startup log
        Logger.info(`Nano App running on port ${iPort}`);
      });
    } catch (oError) {
      Logger.error('Error trying to start the server.', oError);
      process.exit(1);
    }
  }

  /** Initializes the application in the right order */
  private async initialize(): Promise<void> {
    // Express settings, over the defaults
    for (const [sKey, oValue] of Object.entries({ ...SETTINGS, ...this.oConfig.settings })) {
      this.oApp.set(sKey, oValue);
    }

    // Packages (body parsers included: they go first)
    for (const fnPackage of packages({ ...PACKAGES, ...this.oConfig.packages })) {
      this.oApp.use(fnPackage);
    }

    // The database of the app first, named as it: the plugins without their own share it
    const { database } = this.oConfig;
    await DatabaseManager.mount(database && new Drizzle(APP_NAME, database));

    // Better Auth's endpoints, when it is on, then the plugins: before, the app's and after
    const aAuth = await Auth.init(this.oConfig.auth);
    const aPlugins = await PluginManager.build(this.oConfig);

    // Registers their routes in order
    for (const { path, handler } of [...aAuth, ...aPlugins]) {
      Logger.info(path);
      this.oApp.all(path, handler);
    }

    // Unmatched requests become a 404 for the error handler
    this.oApp.use(notFoundHandler);

    // Error handler: always last, so it covers every package above
    this.oApp.use(errorHandler);
  }
}
