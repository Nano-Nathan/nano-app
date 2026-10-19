import type { Express, Request } from 'express';
import { ApiPromise } from './api';

// any: `DB` and `T` default to the consumer's Prisma client and data, unknown to the framework

/** Extra params of handlers and callbacks */
export type Params<DB = any> = Partial<NanoObject & { db?: DB; onBeforeResult?: NanoObject }>;

/** Endpoint handlers */
export type Handler<DB> = (req: Request, params: Params<DB>) => ApiPromise;
export type Handlers<DB = any> = {
  GET?: Handler<DB>;
  POST?: Handler<DB>;
  PUT?: Handler<DB>;
  DELETE?: Handler<DB>;
};

/** Callbacks */
export type Callback<DB> = (params: Params<DB>) => Promise<void>;
export type CallbackMethod<DB> = (
  req: Request,
  method: string,
  params: Params<DB>,
) => Promise<NanoObject>;
export type CallbackMount<DB> = (app: Express, params: Params<DB>) => Promise<void>;

/** Callbacks of an endpoint. They never receive the app: what affects the whole app goes in the plugin's onMount */
export type Callbacks<DB = any> = {
  onInit?: Callback<DB>; // Run once, when the endpoint is mounted
  onBefore?: CallbackMethod<DB>; // Run before the endpoint is executed
};

/** Callbacks of a plugin */
export type PluginCallbacks<DB = any> = {
  onMount?: CallbackMount<DB>; // Run once with the Express app, after its database and before its endpoints (e.g. app-level middlewares)
};

/** Entry of a route file (`*.route.ts`) */
export type RouteEntry<DB = any> = {
  expression?: string; // Support express route expressions
  callbacks?: Callbacks<DB>;
} & Handlers<DB>;

/** Entry of a store file (`*.store.ts`) */
export type StoreEntry<T = any> = {
  type: 'app' | 'api';
  path?: string;
  data?: NanoObject<T>;
};

/** Entry of a Prisma client file (`client.ts` or `client.js`)*/
export type PrismaEntry = new (options: { adapter: unknown }) => any;

/* Generic object */
export type NanoObject<T = any> = Record<string, T>;
