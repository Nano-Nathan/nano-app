import { z } from 'zod';
import type { Callback, CallbackMethod, Handler, RouteEntry } from '../types/route';

/** A function of the consumer, typed as what the framework calls */
function callable<T>(): z.ZodType<T> {
  return z.custom<T>(oValue => typeof oValue === 'function');
}

/** Permissions of Better Auth's admin plugin: the actions per resource */
const PERMISSIONS = z.record(z.string(), z.array(z.string())).optional();

/** A method of a route: its handler, or it with its own permissions */
const METHOD = z
  .union([
    callable<Handler<any>>(),
    z.object({
      handler: callable<Handler<any>>(),
      permissions: PERMISSIONS,
    }),
  ])
  .optional();

/** A `*.route.ts` file: its options, its callbacks and at least one HTTP method, nothing else */
export const ROUTE: z.ZodType<RouteEntry> = z
  .strictObject({
    expression: z.string().optional(),
    public: z.boolean().optional(),
    permissions: PERMISSIONS,
    callbacks: z
      .object({
        onInit: callable<Callback<any>>().optional(),
        onBefore: callable<CallbackMethod<any>>().optional(),
      })
      .optional(),
    GET: METHOD,
    POST: METHOD,
    PUT: METHOD,
    DELETE: METHOD,
    QUERY: METHOD,
  })
  .refine(({ GET, POST, PUT, DELETE, QUERY }) => GET ?? POST ?? PUT ?? DELETE ?? QUERY, {
    error: 'It defines no HTTP method',
  });
