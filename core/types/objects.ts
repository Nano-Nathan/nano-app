import type { Request } from 'express';
import type { ApiPromise } from './api';

/** Extra params of handlers and callbacks: what the app injects (options, `db`) and the framework adds */
export type Params<Deps = NanoObject<any>> = Deps & {
  /** `{ user, session }` of Better Auth, when the request has one */
  session?: NanoObject;
};

/** Params of a handler: also what `onBefore` returned, `{}` without it */
export type HandlerParams<Deps = NanoObject<any>> = Params<Deps> & { onBeforeResult: NanoObject };

/** Endpoint handler */
export type Handler<Deps> = (req: Request, params: HandlerParams<Deps>) => ApiPromise;

/** A method with its own permissions, instead of those of the route */
export type MethodEntry<Deps = NanoObject<any>> = {
  handler: Handler<Deps>;
  /** With Better Auth on, the permissions this method needs instead of the route's */
  permissions?: NanoObject<string[]>;
};

/** Endpoint handlers, one per HTTP method: the handler, or it with its permissions */
export type Handlers<Deps = NanoObject<any>> = {
  GET?: Handler<Deps> | MethodEntry<Deps>;
  POST?: Handler<Deps> | MethodEntry<Deps>;
  PUT?: Handler<Deps> | MethodEntry<Deps>;
  DELETE?: Handler<Deps> | MethodEntry<Deps>;
  QUERY?: Handler<Deps> | MethodEntry<Deps>;
};

/** Callback run with the params */
export type Callback<Deps> = (params: Params<Deps>) => Promise<void>;

/** Callback run before a method, with its request */
export type CallbackMethod<Deps> = (
  req: Request,
  method: string,
  params: Params<Deps>,
) => Promise<NanoObject>;

/** Callback run once with the params */
export type CallbackMount<Deps> = (params: Params<Deps>) => Promise<void>;

/** Callbacks of an endpoint; what affects the whole app goes in the plugin's onMount */
export type Callbacks<Deps = NanoObject<any>> = {
  /** Run once, when the endpoint is mounted */
  onInit?: Callback<Deps>;
  /** Run before the endpoint is executed */
  onBefore?: CallbackMethod<Deps>;
};

/** Callbacks of a plugin */
export type PluginCallbacks<Deps = NanoObject<any>> = {
  /** Run once, after its database and before its endpoints: the plugin's setup */
  onMount?: CallbackMount<Deps>;
};

/** Endpoint params */
export type EndpointParams<Deps = NanoObject<any>> = {
  /** With Better Auth on, answers without a session; the handlers still receive it when there is one */
  public?: boolean;
  /** With Better Auth on, the permissions of its admin plugin the user needs (`{ notes: ['read'] }`) */
  permissions?: NanoObject<string[]>;
  callbacks?: Callbacks<Deps>;
} & Handlers<Deps>;

/** Route params */
export type RouteParams = {
  /** Express route expression appended to the path (e.g. `/:id`) */
  expression?: string;
};

/** Entry of a route file (`*.route.ts`) */
export type RouteEntry<Deps = NanoObject<any>> = RouteParams & EndpointParams<Deps>;

/** Generic object */
export type NanoObject<T = any> = Record<string, T>;
