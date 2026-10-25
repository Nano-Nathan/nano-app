import type { Express, Request } from 'express';
import type { ApiPromise } from './api';

// any: `DB` and `T` default to the consumer's Prisma client and data, unknown to the framework

/** Extra params of handlers and callbacks */
export type Params<DB = any> = Partial<
  NanoObject & {
    db?: DB;
    onBeforeResult?: NanoObject;
    /** `{ user, session }` of Better Auth, on the routes behind its guard */
    session?: NanoObject;
  }
>;

/** Endpoint handler */
export type Handler<DB> = (req: Request, params: Params<DB>) => ApiPromise;

/** Endpoint handlers, one per HTTP method */
export type Handlers<DB = any> = {
  GET?: Handler<DB>;
  POST?: Handler<DB>;
  PUT?: Handler<DB>;
  DELETE?: Handler<DB>;
  QUERY?: Handler<DB>;
};

/** Callback run with the params */
export type Callback<DB> = (params: Params<DB>) => Promise<void>;

/** Callback run before a method, with its request */
export type CallbackMethod<DB> = (
  req: Request,
  method: string,
  params: Params<DB>,
) => Promise<NanoObject>;

/** Callback run with the Express app */
export type CallbackMount<DB> = (app: Express, params: Params<DB>) => Promise<void>;

/** Callbacks of an endpoint. They never receive the app: what affects the whole app goes in the plugin's onMount */
export type Callbacks<DB = any> = {
  /** Run once, when the endpoint is mounted */
  onInit?: Callback<DB>;
  /** Run before the endpoint is executed */
  onBefore?: CallbackMethod<DB>;
};

/** Callbacks of a plugin */
export type PluginCallbacks<DB = any> = {
  /** Run once with the Express app, after its database and before its endpoints (e.g. app-level middlewares) */
  onMount?: CallbackMount<DB>;
};

/** Entry of a route file (`*.route.ts`) */
export type RouteEntry<DB = any> = {
  /** Express route expression appended to the path (e.g. `/:id`) */
  expression?: string;
  callbacks?: Callbacks<DB>;
} & Handlers<DB>;

/** Entry of a Prisma client file (`client.ts` or `client.js`)*/
export type PrismaEntry = new (options: { adapter: unknown }) => any;

/** Generic object */
export type NanoObject<T = any> = Record<string, T>;
