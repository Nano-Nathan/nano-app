import type { NanoObject } from '@nano-app/core/types/objects';

/** A route of `auth.routes` as the proxy keeps it, ready to ask Better Auth */
export type GuardedRoute = {
  /** `/api/<store><auth.path>`: Better Auth through the proxy */
  authPath: string;
  match: string;
  redirect: string;
  /** Roles of the admin plugin; empty without any */
  roles: Set<string>;
  /** Actions per resource, as Better Auth's `has-permission` takes them */
  permissions?: NanoObject<string[]>;
};

/** Where the proxy sends a request of a store: its backend, or the env var the store misses */
export type ProxyTarget = { url: string; headers: Headers } | { store: string; missing: string };
