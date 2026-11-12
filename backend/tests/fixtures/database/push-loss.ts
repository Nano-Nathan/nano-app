import { pgSchema, serial } from 'drizzle-orm/pg-core';

/** The push schema without the title: pushing it drops a column */
export const appPush = pgSchema('app_push');

/** Items without their title */
export const items = appPush.table('items', {
  id: serial().primaryKey(),
});
