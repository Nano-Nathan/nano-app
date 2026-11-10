import { integer, pgSchema } from 'drizzle-orm/pg-core';

/** A table in a `nano_*` schema: the app may not use it, the plugin "test" may */
export const items = pgSchema('nano_test').table('items', { id: integer().primaryKey() });
