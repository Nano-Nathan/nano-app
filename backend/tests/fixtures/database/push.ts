import { pgSchema, serial, text } from 'drizzle-orm/pg-core';

/** Schema the push tests apply at startup */
export const appPush = pgSchema('app_push');

/** Items with a title */
export const items = appPush.table('items', {
  id: serial().primaryKey(),
  title: text(),
});
