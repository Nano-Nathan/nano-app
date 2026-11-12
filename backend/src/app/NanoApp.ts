import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'dotenv/config';
import { Logger } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import Plugin from '../plugins/Plugin';
import { PACKAGES, PORT, ROUTES_DIR, SETTINGS } from './config';
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
    // Express settings
    for (const [sKey, oValue] of Object.entries(this.oConfig.settings ?? SETTINGS)) {
      this.oApp.set(sKey, oValue);
    }

    // Packages (body parsers included: they go first)
    this.setPackages(this.oConfig.packages ?? PACKAGES);

    // The app's plugin, between the ones before and after it
    const { routesDir = ROUTES_DIR, database, plugins } = this.oConfig;
    const oAppPlugin = { name: APP_NAME, routesDir, database };
    const aPlugins = [...(plugins?.before ?? []), oAppPlugin, ...(plugins?.after ?? [])];

    // Mounts them in order
    for (const oPlugin of aPlugins) {
      await new Plugin(oPlugin).mount(this.oApp);
    }

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
