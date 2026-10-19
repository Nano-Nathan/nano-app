import { Formatter } from '@nano-app/core';
import type { NanoAppConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

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
      format: ':timestamp | :method :url :status',
    },
    cors: {},
    helmet: true,
    compression: true,
    rateLimit: {
      max: 1000,
      message: 'Too many requests, please try again later.',
    },
    express: {
      limit: '10kb',
    },
    urlencoded: {
      extended: false,
    },
  },

  /** Main plugin to mount */
  mainPlugin: {
    routesDir: 'src/routes',
    basePath: '',
    database: {
      enabled: false,
      schemaPath: 'src/prisma/schema.prisma',
    },
  },

  /** Plugins around the consumer routes */
  plugins: [],
} satisfies NanoAppConfig;

/**
 * Merges the consumer configuration with the initial one.
 */
export function mergeConfig(oConfig: NanoAppConfig = {}): NanoAppConfig &
  Required<Pick<NanoAppConfig, 'settings' | 'plugins'>> & {
    mainPlugin: PluginConfig;
  } {
  // Each package keeps its default unless the consumer sets it; mainPlugin is always named "app"
  return {
    ...INITIAL_CONFIG,
    ...oConfig,
    settings: oConfig.settings ?? INITIAL_CONFIG.settings,
    packages: {
      ...INITIAL_CONFIG.packages,
      ...(oConfig.packages ?? {}),
      morgan: oConfig.packages?.morgan ?? INITIAL_CONFIG.packages.morgan,
      cors: oConfig.packages?.cors ?? INITIAL_CONFIG.packages.cors,
      helmet: oConfig.packages?.helmet ?? INITIAL_CONFIG.packages.helmet,
      compression: oConfig.packages?.compression ?? INITIAL_CONFIG.packages.compression,
      rateLimit: oConfig.packages?.rateLimit ?? INITIAL_CONFIG.packages.rateLimit,
      express: oConfig.packages?.express ?? INITIAL_CONFIG.packages.express,
      urlencoded: oConfig.packages?.urlencoded ?? INITIAL_CONFIG.packages.urlencoded,
    },
    mainPlugin: {
      ...INITIAL_CONFIG.mainPlugin,
      ...oConfig.mainPlugin,
      name: 'app',
      database: {
        ...INITIAL_CONFIG.mainPlugin.database,
        ...oConfig.mainPlugin?.database,
      },
    },
    plugins: oConfig.plugins ?? INITIAL_CONFIG.plugins,
  };
}
