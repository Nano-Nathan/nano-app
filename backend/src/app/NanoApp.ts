import express, { type Express } from "express";
import { Plugin } from "../routes/Plugin";
import { Database } from "../database/Database";

// Middlewares
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Config
import "dotenv/config";
import type { NanoAppConfig, PackagesConfig } from "../types/app";
import type { PluginConfig } from "../types/plugin";
import { mergeConfig } from "./config";
import { errorHandler, notFoundHandler } from "./errors";
import { NanoObject } from "@nano-app/core";

/** Main NanoApp class */
export class NanoApp {
  protected app: Express;
  protected config: ReturnType<typeof mergeConfig>;

  constructor(config: NanoAppConfig = {}) {
    this.app = express();
    this.config = mergeConfig(config);
    this.start();
  }

  /** Starts the application */
  private async start(): Promise<NanoApp> {
    try {
      await this.initialize();

      // Init server
      this.app.listen(Number(this.config.port), () => {
        // Runs the consumer listener
        this.config.listener?.();

        // Startup log
        console.log(`\n[nano-app] [INFO] Nano App running on port ${this.config.port}\n`);
      });

      return this;
    } catch (error) {
      console.error("[nano-app] [ERROR] Error trying to start the server.", error);
      process.exit(1);
    }
  }

  /** Initializes the application in the right order */
  private async initialize() {
    // Express settings
    Object.entries(this.config.settings ?? {}).forEach(([key, value]) => this.app.set(key, value));

    // Packages (body parsers included: they go first)
    this.setPackages(this.config.packages);

    // Plugins separated by stage
    const oPlugins: NanoObject<PluginConfig[]> = { before: [], after: [] };
    this.config.plugins?.forEach((plugin) => {
      oPlugins[plugin.stage ?? "before"].push(plugin);
    });

    // Create plugins before, in order
    for (const plugin of oPlugins.before) await new Plugin(plugin).mount(this.app);

    // Create consumer plugin
    await new Plugin(this.config.mainPlugin).mount(this.app);

    // Create plugins after, in order
    for (const plugin of oPlugins.after) await new Plugin(plugin).mount(this.app);

    // Unmatched requests become a 404 for the error handler
    this.app.use(notFoundHandler);

    // Error handler: always last, so it covers every package above
    this.app.use(errorHandler);
  }

  /* Adds the packages according to the configuration */
  private setPackages(config: PackagesConfig = {}): void {
    /** Morgan */
    if (config.morgan) {
      Object.entries(config.morgan.tokens ?? {})
        .forEach(([key, value]) => morgan.token(key, value));
      this.app.use(morgan(config.morgan.format));
    }

    /** CORS */
    if (config.cors) {
      this.app.use(cors(config.cors));
    }

    /** Helmet */
    if (config.helmet) {
      this.app.use(helmet());
    }

    /** Compression */
    if (config.compression) {
      this.app.use(compression());
    }

    /** Rate Limit */
    if (config.rateLimit) {
      this.app.use(rateLimit(config.rateLimit));
    }

    /** JSON */
    if (config.express) {
      this.app.use(express.json(config.express));
    }

    /** URLencoded */
    if (config.urlencoded) {
      this.app.use(express.urlencoded(config.urlencoded));
    }
  }
}
