import { pgSchema, serial, text } from 'drizzle-orm/pg-core';

/** Schema of the app's tables in the tests */
const appData = pgSchema('app_data');

/** Notes of the app */
export const notes = appData.table('notes', {
  id: serial().primaryKey(),
  title: text().notNull(),
});
