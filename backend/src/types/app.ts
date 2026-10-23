import type express from 'express';
import type { Options } from 'express-rate-limit';
import type { CorsOptions } from 'cors';
import type { BetterAuthOptions } from 'better-auth';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { MainPluginConfig, PluginConfig } from './plugin';

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
  /** Rate-limit configuration */
  rateLimit?: Partial<Options> | false;
  /** express.json configuration */
  express?: Partial<Parameters<typeof express.json>[0]> | false;
  /** urlencoded configuration */
  urlencoded?: Partial<Parameters<typeof express.urlencoded>[0]> | false;
  /** Better Auth options, without `database`: it uses the app's Prisma client. Defaults to false */
  betterAuth?: Omit<BetterAuthOptions, 'database'> | false;
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
  /** Plugins to mount. Defaults to [] */
  plugins?: PluginConfig[];
  /** Main plugin to mount. */
  mainPlugin?: MainPluginConfig;
};
