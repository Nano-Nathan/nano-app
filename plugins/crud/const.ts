import { createInsertSchema, createUpdateSchema } from 'drizzle-orm/zod';
import type { ZodType } from 'zod';
import type { NanoObject } from '@nano-app/backend';

/** Schema of the body of each write, from the columns of its table */
export const SCHEMAS: NanoObject<(oTable: any) => ZodType> = {
  create: createInsertSchema,
  update: createUpdateSchema,
};
