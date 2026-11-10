import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Permissions from '../crud/Permissions';
import { relations } from '../../backend/tests/fixtures/database/crud';

/** Permissions over the relations of the crud fixture: notes with their comments */
const PERMISSIONS = new Permissions(relations);

describe('crud permissions', () => {
  test('a read without relations needs only its table', () => {
    // Reads notes filtered and ordered by their own columns
    const oQuery = { filter: { title: { like: 'a%' } }, orderby: { id: 'asc' as const } };
    assert.deepEqual(PERMISSIONS.of('note', 'read', oQuery), { note: ['read'] });
  });

  test('an expand needs read on every table along its paths', () => {
    // Reads comments with their note, and notes with their comments and theirs
    assert.deepEqual(PERMISSIONS.of('comment', 'read', { expand: 'note' }), {
      note: ['read'],
      comment: ['read'],
    });
    assert.deepEqual(PERMISSIONS.of('note', 'read', { expand: 'comments.note' }), {
      comment: ['read'],
      note: ['read'],
    });
  });

  test('a filter needs read on the relations it names, inside AND, OR and NOT', () => {
    // Filters comments by the title of their note, nested in AND
    const oFilter = { AND: [{ note: { title: { like: 'a%' } } }] };
    assert.deepEqual(PERMISSIONS.of('comment', 'read', { filter: oFilter }), {
      note: ['read'],
      comment: ['read'],
    });
  });

  test('a write needs only its action on its table', () => {
    // Writes with a body that names a relation: Drizzle writes one table
    assert.deepEqual(PERMISSIONS.of('note', 'update', { comments: [{ text: 'a' }] }), {
      note: ['update'],
    });
  });
});
