import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import Plugin from '../routes/Plugin';
import { mergeConfig } from './config';
import { errorHandler, notFoundHandler } from './errors';
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
  private async start(): Promise<NanoApp> {
    try {
      await this.initialize();

      // Init server
      this.oApp.listen(Number(this.oConfig.port), () => {
        // Runs the consumer listener
        this.oConfig.listener?.();

        // Startup log
        console.log(`\n[nano-app] [INFO] Nano App running on port ${this.oConfig.port}\n`);
      });

      return this;
    } catch (oError) {
      console.error('[nano-app] [ERROR] Error trying to start the server.', oError);
      process.exit(1);
    }
  }

  /** Initializes the application in the right order */
  private async initialize(): Promise<void> {
    // Express settings
    for (const [sKey, oValue] of Object.entries(this.oConfig.settings ?? {})) {
      this.oApp.set(sKey, oValue);
    }

    // Packages (body parsers included: they go first)
    this.setPackages(this.oConfig.packages);

    // Plugins separated by stage
    const oPlugins: NanoObject<PluginConfig[]> = { before: [], after: [] };
    for (const oPlugin of this.oConfig.plugins ?? []) {
      oPlugins[oPlugin.stage ?? 'before'].push(oPlugin);
    }

    // Create plugins before, in order
    for (const oPlugin of oPlugins.before) await new Plugin(oPlugin).mount(this.oApp);

    // Create consumer plugin
    await new Plugin(this.oConfig.mainPlugin).mount(this.oApp);

    // Create plugins after, in order
    for (const oPlugin of oPlugins.after) await new Plugin(oPlugin).mount(this.oApp);

    // Unmatched requests become a 404 for the error handler
    this.oApp.use(notFoundHandler);

    // Error handler: always last, so it covers every package above
    this.oApp.use(errorHandler);
  }

  /** Adds the packages according to the configuration */
  private setPackages(oConfig: PackagesConfig = {}): void {
    // Morgan
    if (oConfig.morgan) {
      for (const [sKey, fnToken] of Object.entries(oConfig.morgan.tokens ?? {})) {
        morgan.token(sKey, fnToken);
      }
      this.oApp.use(morgan(oConfig.morgan.format));
    }

    // CORS
    if (oConfig.cors) {
      this.oApp.use(cors(oConfig.cors));
    }

    // Helmet
    if (oConfig.helmet) {
      this.oApp.use(helmet());
    }

    // Compression
    if (oConfig.compression) {
      this.oApp.use(compression());
    }

    // Rate Limit
    if (oConfig.rateLimit) {
      this.oApp.use(rateLimit(oConfig.rateLimit));
    }

    // JSON
    if (oConfig.express) {
      this.oApp.use(express.json(oConfig.express));
    }

    // URLencoded
    if (oConfig.urlencoded) {
      this.oApp.use(express.urlencoded(oConfig.urlencoded));
    }
  }
}
