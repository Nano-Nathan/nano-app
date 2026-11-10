import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Query from '../crud/Query';
import { relations } from '../../backend/tests/fixtures/database/crud';

describe('crud related tables', () => {
  test('a where by its own columns names no related table', () => {
    // Filters notes by their title, inside AND
    const oWhere = { AND: [{ title: { like: 'a%' } }] };
    assert.deepEqual(Query.related(relations, 'note', oWhere), []);
  });

  test('a where and a with name the tables of their relations, at any depth', () => {
    // Comments with their note, filtered by the comments of that note
    const oWhere = { note: { comments: { text: { like: 'a%' } } } };
    const aRelated = Query.related(relations, 'comment', [oWhere, { note: true }]);
    assert.deepEqual(aRelated, ['note', 'comment', 'note']);
  });
});
