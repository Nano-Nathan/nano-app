import type express from 'express';
import type { CorsOptions } from 'cors';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { AuthOptions } from './auth';
import type { PluginManagerConfig } from './plugin';

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

/** What NanoApp reads: the server */
export type ServerConfig = {
  /** Listener run once the server is listening */
  listener?: () => void;
  /** Application port. Defaults to 3000 */
  port?: number;
  /** Values for Express `app.set()` (e.g. `{ "trust proxy": 1 }`), over the defaults */
  settings?: NanoObject<unknown>;
  /** Base middlewares: each one set replaces its default */
  packages?: PackagesConfig;
  /** Better Auth options: with them, every route needs a session unless it is `public` */
  auth?: AuthOptions;
};

/** Application configuration: the server and its plugins */
export type NanoAppConfig = ServerConfig & PluginManagerConfig;
