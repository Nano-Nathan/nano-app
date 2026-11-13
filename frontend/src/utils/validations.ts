import { z } from 'zod';
import { API_STORE_TYPE } from '@nano-app/core/const';
import { APP_STORE_TYPE, DEFAULT_REDIRECT } from '../const';
import Paths from './Paths';
import type { StoreFile } from '../types/store';

/** A path of the app, starting with `/` */
const PATH = z.string().startsWith('/');

/** A `*.store.ts` file: its type, its initial state, the headers of its proxy and Better Auth */
export const STORE: z.ZodType<StoreFile> = z.object({
  type: z.enum([APP_STORE_TYPE, API_STORE_TYPE]),
  data: z.record(z.string(), z.any()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  auth: z
    .object({
      path: z.string().optional(),
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
