import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Permissions from '../crud/Permissions';
import type { DataModels } from '../types/crud';

/** Models shaped like an app with Better Auth: collections of a user, with their accounts and sessions */
const MODELS: DataModels = {
  Collections: {
    fields: [
      { name: 'id', kind: 'scalar', type: 'Int' },
      { name: 'userId', kind: 'scalar', type: 'String' },
      { name: 'user', kind: 'object', type: 'User' },
    ],
  },
  User: {
    fields: [
      { name: 'id', kind: 'scalar', type: 'String' },
      { name: 'role', kind: 'scalar', type: 'String' },
      { name: 'accounts', kind: 'object', type: 'Account' },
      { name: 'sessions', kind: 'object', type: 'Session' },
    ],
  },
  Account: { fields: [{ name: 'password', kind: 'scalar', type: 'String' }] },
  Session: { fields: [{ name: 'token', kind: 'scalar', type: 'String' }] },
};

/** Permissions over those models */
const PERMISSIONS = new Permissions(MODELS);

describe('crud permissions', () => {
  test('a read without relations needs only its model', () => {
    // Reads collections filtered and ordered by their own fields
    const oQuery = { filter: { id: { gt: 1 } }, orderby: { id: 'asc' }, select: 'id,userId' };

    assert.deepEqual(PERMISSIONS.of('collections', 'read', oQuery), {
      collections: ['read'],
    });
  });

  test('expand, select and orderby need read on every relation of their paths', () => {
    // Each way of reaching a relation by a path
    assert.deepEqual(PERMISSIONS.of('collections', 'read', { expand: 'user.accounts' }), {
      user: ['read'],
      account: ['read'],
      collections: ['read'],
    });
    assert.deepEqual(PERMISSIONS.of('collections', 'read', { select: 'id, user' }), {
      user: ['read'],
      collections: ['read'],
    });
    assert.deepEqual(PERMISSIONS.of('collections', 'read', { orderby: { 'user.role': 'asc' } }), {
      user: ['read'],
      collections: ['read'],
    });
  });

  test('a filter needs read on the relations it names, inside AND, OR, NOT and some', () => {
    // Filters by the sessions of the user, nested in AND and is/some
    const oFilter = {
      AND: [{ user: { is: { sessions: { some: { token: { startsWith: 'a' } } } } } }],
    };

    assert.deepEqual(PERMISSIONS.of('collections', 'read', { filter: oFilter }), {
      user: ['read'],
      session: ['read'],
      collections: ['read'],
    });
  });

  test('a write needs its own action on every relation its data reaches', () => {
    // Updates a collection and, nested, the role of its user
    const oData = { id: 1, user: { update: { role: 'admin' } } };

    assert.deepEqual(PERMISSIONS.of('collections', 'update', oData), {
      user: ['update'],
      collections: ['update'],
    });
  });

  test('a delete needs only its model', () => {
    assert.deepEqual(PERMISSIONS.of('collections', 'delete', {}), {
      collections: ['delete'],
    });
  });
});
