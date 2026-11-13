import { defineRelations } from 'drizzle-orm';
import { integer, pgSchema } from 'drizzle-orm/pg-core';

/** The `nano_test` schema, exported so drizzle-kit creates it */
export const nanoTest = pgSchema('nano_test');

/** A table in a `nano_*` schema: the app may not use it, the plugin "test" may */
export const items = nanoTest.table('items', { id: integer().primaryKey() });

/** Its relations, as a database takes them */
export const relations = defineRelations({ items });
