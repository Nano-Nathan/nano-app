import { z } from 'zod';
import { API_STORE_TYPE, APP_STORE_TYPE, DEFAULT_REDIRECT } from '../const';
import Paths from './Paths';
import type { Callback, CallbackMethod, Handler, RouteEntry } from '../types/objects';
import type { StoreFile } from '../types/store';

// any: what the app injects in the params of its handlers and callbacks is unknown to the framework

/** Permissions of Better Auth's admin plugin: the actions per resource */
const PERMISSIONS = z.record(z.string(), z.array(z.string())).optional();

/** A method of a route: its handler, or it with its own permissions */
const METHOD = z
  .union([
    z.custom<Handler<any>>(oValue => typeof oValue === 'function'),
    z.object({
      handler: z.custom<Handler<any>>(oValue => typeof oValue === 'function'),
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
        onInit: z.custom<Callback<any>>(oValue => typeof oValue === 'function').optional(),
        onBefore: z.custom<CallbackMethod<any>>(oValue => typeof oValue === 'function').optional(),
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

/** A path of the app, starting with `/` */
const PATH = z.string().startsWith('/');

/** A `*.store.ts` file: its type, its initial state, the headers of its proxy and Better Auth */
export const STORE: z.ZodType<StoreFile> = z.object({
  type: z.enum([APP_STORE_TYPE, API_STORE_TYPE]),
  data: z.record(z.string(), z.any()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  auth: z
    .object({
      path: z.string(),
      routes: z
        .array(
          z
            .object({
              match: PATH,
              redirect: PATH.optional(),
              roles: z.string().optional(),
              permissions: z.record(z.string(), z.string()).optional(),
            })
            .refine(({ match, redirect }) => !Paths.matches(match, redirect ?? DEFAULT_REDIRECT), {
              error: 'Its "redirect" must be outside its "match"',
            }),
        )
        .optional(),
    })
    .optional(),
});
