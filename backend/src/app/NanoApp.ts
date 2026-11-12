import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'dotenv/config';
import { Logger } from '@nano-app/core';
import Plugin from '../plugins/Plugin';
import { mergeConfig } from './config';
import { errorHandler, notFoundHandler } from './handlers/errors';
import type { NanoObject } from '@nano-app/core';
import type { NanoAppConfig, PackagesConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** Main NanoApp class */
export default class NanoApp {
  protected oApp: Express;
  protected oConfig: ReturnType<typeof mergeConfig>;

  constructor(oConfig: NanoAppConfig = {}) {
    this.oApp = express();
    this.oConfig = mergeConfig(oConfig);
    this.start();
  }

  /** Starts the application */
  private async start(): Promise<void> {
    try {
      await this.initialize();

      // Init server
      this.oApp.listen(this.oConfig.port, () => {
        // Runs the consumer listener
        this.oConfig.listener?.();

        // Startup log
        Logger.info(`Nano App running on port ${this.oConfig.port}`);
      });
    } catch (oError) {
      Logger.error('Error trying to start the server.', oError);
      process.exit(1);
    }
  }

  /** Initializes the application in the right order */
  private async initialize(): Promise<void> {
    // Express settings
    for (const [sKey, oValue] of Object.entries(this.oConfig.settings)) {
      this.oApp.set(sKey, oValue);
    }

    // Packages (body parsers included: they go first)
    this.setPackages(this.oConfig.packages);

    // Plugins separated by stage
    const { mainPlugin, plugins } = this.oConfig;
    const oPlugins: NanoObject<PluginConfig[]> = { before: [], after: [] };
    for (const oPlugin of plugins) oPlugins[oPlugin.stage ?? 'before'].push(oPlugin);

    // Mounts the ones before the app, the app's and the ones after
    for (const oPlugin of [...oPlugins.before, mainPlugin, ...oPlugins.after]) {
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
