import { Formatter } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core';
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
    betterAuth: false,
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

/** Whether a value is a plain object (`{}`), the only kind merged field by field */
function isPlainObject(oValue: unknown): oValue is NanoObject {
  return Object.prototype.toString.call(oValue) === '[object Object]';
}

/** Merges a value over its default: plain objects key by key at every level; anything else replaces it */
function deepMerge(oDefault: unknown, oValue: unknown): unknown {
  // Not set: the default
  if (oValue === undefined) return oDefault;

  // Not two plain objects (`false`, arrays, functions, primitives): the value wins
  if (!isPlainObject(oDefault) || !isPlainObject(oValue)) return oValue;

  // Two plain objects: each key merged with its default
  const aKeys = Object.keys({ ...oDefault, ...oValue });
  return Object.fromEntries(aKeys.map(sKey => [sKey, deepMerge(oDefault[sKey], oValue[sKey])]));
}

/** Merges the consumer configuration over the initial one; the main plugin is always named "app" */
export function mergeConfig(oConfig: NanoAppConfig = {}): NanoAppConfig &
  Required<Pick<NanoAppConfig, 'settings' | 'plugins' | 'packages'>> & {
    mainPlugin: PluginConfig;
  } {
  // Every level keeps its default where the consumer set nothing
  const oMerged = deepMerge(INITIAL_CONFIG, oConfig) as typeof INITIAL_CONFIG;

  // Names the main plugin
  return { ...oMerged, mainPlugin: { ...oMerged.mainPlugin, name: APP_NAME } };
}
