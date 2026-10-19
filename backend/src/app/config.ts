import { Formatter } from '@nano-app/core';
import type { NanoAppConfig, PackagesConfig } from '../types/app';
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
    cors: {
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'QUERY'],
    },
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

/** Merges one package with its default: `false` turns it off, an object is merged field by field */
function mergePackage(oDefault: unknown, oValue: unknown): unknown {
  // Not set: the default
  if (oValue === undefined) return oDefault;

  // Turned off, or a value that is not an object (e.g. `helmet: true`)
  if (oValue === false || typeof oValue !== 'object' || typeof oDefault !== 'object') return oValue;

  // An object: the consumer's fields over the default ones
  return { ...oDefault, ...oValue };
}

/**
 * Merges the consumer configuration with the initial one.
 */
export function mergeConfig(oConfig: NanoAppConfig = {}): NanoAppConfig &
  Required<Pick<NanoAppConfig, 'settings' | 'plugins'>> & {
    mainPlugin: PluginConfig;
  } {
  // Each package is merged with its default; mainPlugin is always named "app"
  return {
    ...INITIAL_CONFIG,
    ...oConfig,
    settings: oConfig.settings ?? INITIAL_CONFIG.settings,
    packages: Object.fromEntries(
      Object.entries(INITIAL_CONFIG.packages).map(([sKey, oDefault]) => [
        sKey,
        mergePackage(oDefault, oConfig.packages?.[sKey as keyof PackagesConfig]),
      ]),
    ),
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
