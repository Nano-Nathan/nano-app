import { defineRelations } from 'drizzle-orm';
import { integer, pgSchema, serial, text, uuid } from 'drizzle-orm/pg-core';

/** Schema of the crud tests */
const crudTest = pgSchema('crud_test');

/** Notes, each with its comments */
export const note = crudTest.table('note', {
  id: serial().primaryKey(),
  title: text().notNull(),
});

/** Comments of a note, with a string id */
export const comment = crudTest.table('comment', {
  id: uuid().primaryKey().defaultRandom(),
  text: text().notNull(),
  noteId: integer()
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
});

/** A table the app does not publish */
export const secret = crudTest.table('secret', { id: serial().primaryKey() });

/** Relations between notes and comments */
export const relations = defineRelations({ note, comment, secret }, r => ({
  note: { comments: r.many.comment() },
  comment: { note: r.one.note({ from: r.comment.noteId, to: r.note.id }) },
}));
