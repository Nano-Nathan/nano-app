/** Re-exported Express type: the consumer does not need @types/express */
export type { Request } from 'express';

/** HTTP contract */
export type { ApiPromise, ApiResponse, NanoObject } from '@nano-app/core';
export type { RouteEntry, HandlerParams } from './types/route';

/** What the creators return: a published plugin's types name them */
export type { PluginConfig, PluginOptions } from './types/plugin';
export type { PluginCallbacks } from './types/route';

/** Creators */
export * from './lib/creators';

/** Error of the framework, also for handlers: `throw new NanoError('Not found', 404)` */
export { NanoError } from '@nano-app/core';
