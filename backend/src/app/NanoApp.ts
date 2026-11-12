import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'dotenv/config';
import { Logger } from '@nano-app/core';
import PluginManager from '../plugins/PluginManager';
import BetterAuth from '../auth/BetterAuth';
import { PACKAGES, PORT, SETTINGS } from './config';
import { errorHandler, notFoundHandler } from './handlers/errors';
import type { NanoAppConfig, PackagesConfig } from '../types/app';

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
    this.setPackages({ ...PACKAGES, ...this.oConfig.packages });

    // Better Auth: its tables, its instance and its endpoints, when it is on
    await BetterAuth.mount(this.oApp, this.oConfig.auth);

    // Plugins: the ones before the app, the app's and the ones after
    await PluginManager.mount(this.oApp, this.oConfig);

    // Unmatched requests become a 404 for the error handler
    this.oApp.use(notFoundHandler);

    // Error handler: always last, so it covers every package above
    this.oApp.use(errorHandler);
  }

  /** Adds the packages according to the configuration */
  private setPackages(oConfig: PackagesConfig): void {
    // Morgan
    if (oConfig.morgan) {
      for (const [sKey, fnToken] of Object.entries(oConfig.morgan.tokens ?? {})) {
        morgan.token(sKey, fnToken);
      }
      this.oApp.use(morgan(oConfig.morgan.format));
    }

    // The rest in order, each only when it is on
    const aPackages = [
      oConfig.cors && cors(oConfig.cors),
      oConfig.helmet && helmet(),
      oConfig.compression && compression(),
      oConfig.express && express.json(oConfig.express),
      oConfig.urlencoded && express.urlencoded(oConfig.urlencoded),
    ];
    for (const fnPackage of aPackages) if (fnPackage) this.oApp.use(fnPackage);
  }
}
