import Auth from './auth/Auth';

/** Application configuration and types */
export type { NanoAppConfig, ServerConfig, PackagesConfig } from './types/app';
export type { DatabaseConfig } from './types/database';
export type { PluginConfig, PluginManagerConfig, PluginOptions } from './types/plugin';

/** Re-exported Express type: the consumer does not need @types/express */
export type { Request } from 'express';

/** HTTP contract */
export type { ApiPromise, ApiResponse, QueryParams, NanoObject } from '@nano-app/core';
export type {
  RouteEntry,
  Handler,
  HandlerParams,
  Handlers,
  MethodEntry,
  Params,
  Callbacks,
  PluginCallbacks,
} from './types/route';

/** Main class and creators */
export { default as NanoApp } from './app/NanoApp';
export * from './lib/creators';

/** Error of the framework, also for handlers: `throw new NanoError('Not found', 404)` */
export { NanoError } from '@nano-app/core';

/** Whether the user of a session has the permissions, asked to Better Auth */
export const isGranted = Auth.isGranted.bind(Auth);
