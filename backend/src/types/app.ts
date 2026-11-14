import type express from 'express';
import type { RequestHandler } from 'express';
import type { CorsOptions } from 'cors';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { AuthOptions } from './auth';
import type { PluginManagerConfig } from './plugin';

/** Rate limit per client IP: a bucket of tokens per client, refilled over time */
export type RateLimitConfig = {
  /** Tokens of a full bucket. Defaults to 100 */
  capacity?: number;
  /** Tokens refilled per second. Defaults to 1 */
  refillPerSecond?: number;
  /** Message of the 429 */
  message?: string;
};

/** Tokens of a client's bucket at a time */
export type Bucket = { iTokens: number; iTime: number };

/** Configuration of the framework's built-in packages */
export type PackagesConfig = {
  /** Morgan configuration */
  morgan?:
    | false
    | {
        /** Morgan tokens */
        tokens?: NanoObject<any>;
        /** Morgan format */
        format: string;
      };
  /** CORS configuration */
  cors?: CorsOptions | false;
  /** Rate limit per client IP, off by default; it covers every request, Better Auth's too */
  rateLimit?: RateLimitConfig | false;
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

/** A route NanoApp registers */
export type Mount = {
  /** Express path of the route; without one it is a middleware, run on every request */
  path?: string;
  /** Its handler */
  handler: RequestHandler;
};

/** Application configuration: the server and its plugins */
export type NanoAppConfig = ServerConfig & PluginManagerConfig;
