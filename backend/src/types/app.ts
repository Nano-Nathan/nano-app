import express from "express";
import type { Options } from "express-rate-limit";
import type { CorsOptions } from "cors";
import type { MainPluginConfig, PluginConfig } from "./plugin";

/** Configuration of the framework's built-in packages */
export type PackagesConfig = {
  /** Morgan configuration */
  morgan?: {
    /** Morgan tokens */
    tokens?: Record<string, any>;
    /** Morgan format */
    format: string;
  };
  /** CORS configuration */
  cors?: CorsOptions;
  /** Helmet configuration */
  helmet?: boolean;
  /** Compression configuration */
  compression?: boolean;
  /** Rate-limit configuration */
  rateLimit?: Partial<Options>;
  /** express.json configuration */
  express?: Partial<Parameters<typeof express.json>[0]>;
  /** urlencoded configuration */
  urlencoded?: Partial<Parameters<typeof express.urlencoded>[0]>;
};

/** Application configuration */
export type NanoAppConfig = {
  /** Listener run once the server is listening */
  listener?: () => void;
  /** Application port. Defaults to 3000 */
  port?: number;
  /** Values applied with Express `app.set()` (e.g. `{ "trust proxy": 1 }`) */
  settings?: Record<string, unknown>;
  /** Default middlewares configuration */
  packages?: PackagesConfig;
  /** Plugins to mount. Defaults to [] */
  plugins?: PluginConfig[];
  /** Main plugin to mount. */
  mainPlugin?: MainPluginConfig;
}
