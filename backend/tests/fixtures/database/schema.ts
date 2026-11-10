import { pgSchema, serial, text } from 'drizzle-orm/pg-core';

/** Schema of the app's tables in the tests, exported so drizzle-kit creates it */
export const appData = pgSchema('app_data');

/** Notes of the app */
export const notes = appData.table('notes', {
  id: serial().primaryKey(),
  title: text().notNull(),
});
