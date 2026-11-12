import type express from 'express';
import type { CorsOptions } from 'cors';
import type { BetterAuthOptions } from 'better-auth';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { DatabaseConfig, PluginConfig } from './plugin';

/** Configuration of the framework's built-in packages */
export type PackagesConfig = {
  /** Morgan configuration */
  morgan?:
    | false
    | {
        /** Morgan tokens */
        // any: morgan types each token callback with its own request and response
        tokens?: NanoObject<any>;
        /** Morgan format */
        format: string;
      };
  /** CORS configuration */
  cors?: CorsOptions | false;
  /** Helmet configuration */
  helmet?: boolean;
  /** Compression configuration */
  compression?: boolean;
  /** express.json configuration */
  express?: Partial<Parameters<typeof express.json>[0]> | false;
  /** urlencoded configuration */
  urlencoded?: Partial<Parameters<typeof express.urlencoded>[0]> | false;
};

/** Better Auth options of `src/auth.ts`, without `database`: it uses the app's Drizzle client */
export type AuthOptions = Omit<BetterAuthOptions, 'database'>;

/** Error shape thrown by the consumer handlers */
export type HandlerError = {
  status?: number;
  message?: string;
  warning?: boolean;
};

/** Application configuration */
export type NanoAppConfig = {
  /** Listener run once the server is listening */
  listener?: () => void;
  /** Application port. Defaults to 3000 */
  port?: number;
  /** Values applied with Express `app.set()` (e.g. `{ "trust proxy": 1 }`) */
  settings?: NanoObject<unknown>;
  /** Default middlewares configuration */
  packages?: PackagesConfig;
  /** Plugins to mount. Defaults to { before: [], after: [] } */
  plugins?: {
    /** Plugins to mount before the app */
    before: PluginConfig[];
    /** Plugins to mount after the app */
    after: PluginConfig[];
  };
  /** Directory of the app's `*.route.ts` files. Defaults to "src/routes" */
  routesDir?: string;
  /** Drizzle schema of the app's database, mounted before its endpoints */
  database?: DatabaseConfig;
};
