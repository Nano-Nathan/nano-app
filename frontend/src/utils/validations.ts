import { z } from 'zod';
import { API_STORE_TYPE } from '@nano-app/core/const';
import { APP_STORE_TYPE } from '../const';
import type { StoreFile } from '../types/store';

/** A `*.store.ts` file: its type, its initial state and the headers of its proxy */
export const STORE: z.ZodType<StoreFile> = z.object({
  type: z.enum([APP_STORE_TYPE, API_STORE_TYPE]),
  data: z.record(z.string(), z.any()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});
