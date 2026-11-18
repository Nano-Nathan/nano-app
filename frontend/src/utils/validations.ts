import { z } from 'zod';
import { API_STORE_TYPE } from '@nano-app/core/const';
import { APP_STORE_TYPE } from '../const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { StoreFile } from '../types/store';

/** A `*.store.ts` file: its type and its initial state */
export const STORE: z.ZodType<StoreFile> = z.object({
  type: z.enum([APP_STORE_TYPE, API_STORE_TYPE]),
  data: z.record(z.string(), z.any()).optional(),
});

/** A `*.i18n.ts` file: the texts of its locale, one level of dotted keys */
export const I18N: z.ZodType<NanoObject<string>> = z.record(z.string(), z.string());
