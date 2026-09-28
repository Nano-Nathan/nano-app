import { Formatter } from "@nano-app/core";
import type { NanoAppConfig } from "../types/app";
import type { PluginConfig } from "../types/plugin";

/** Initial application configuration */
export const INITIAL_CONFIG = {
  /** Initial application configuration */
  port: 3000,

  /** Application listener */
  listener: () => {},

  /** Express settings */
  settings: {},

  /** Initial middlewares */
  packages: {
    morgan: {
      tokens: {
        timestamp: () => Formatter.logDate(),
      },
      format: ":timestamp | :method :url :status",
    },
    cors: {},
    helmet: true,
    compression: true,
    rateLimit: {
      max: 1000,
      message: "Too many requests, please try again later.",
    },
    express: {
      limit: "10kb",
    },
    urlencoded: {
      extended: false,
    },
  },
  
  /** Main plugin to mount */
  mainPlugin: {
    routesDir: "src/routes",
    basePath: '/',
    database: {
      enabled: false,
      schemaPath: "src/prisma/schema.prisma",
    },
  },

  /** Plugins around the consumer routes */
  plugins: []
} satisfies NanoAppConfig;

/**
 * Merges the consumer configuration with the initial one.
 */
export function mergeConfig(config: NanoAppConfig = {}): NanoAppConfig & { mainPlugin: PluginConfig } {
  return {
    ...INITIAL_CONFIG,
    ...config,
    settings: config.settings ?? INITIAL_CONFIG.settings,
    packages: {
      ...INITIAL_CONFIG.packages,
      ...(config.packages || {}),
      morgan: config.packages?.morgan ?? INITIAL_CONFIG.packages.morgan,
      cors: config.packages?.cors ?? INITIAL_CONFIG.packages.cors,
      helmet: config.packages?.helmet ?? INITIAL_CONFIG.packages.helmet,
      compression: config.packages?.compression ?? INITIAL_CONFIG.packages.compression,
      rateLimit: config.packages?.rateLimit ?? INITIAL_CONFIG.packages.rateLimit,
      express: config.packages?.express ?? INITIAL_CONFIG.packages.express,
      urlencoded: config.packages?.urlencoded ?? INITIAL_CONFIG.packages.urlencoded,
    },
    mainPlugin: {
      ...INITIAL_CONFIG.mainPlugin,
      ...config.mainPlugin,
      name: 'app',
      database: {
        ...INITIAL_CONFIG.mainPlugin.database,
        ...config.mainPlugin?.database,
      },
    },
    plugins: config.plugins ?? INITIAL_CONFIG.plugins,
  };
}
