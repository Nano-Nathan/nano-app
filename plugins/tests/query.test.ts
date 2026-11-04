import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Query from '../crud/Query';

describe('Query', () => {
  test('without parameters asks for the first 100 records', () => {
    // Checks the default amount
    assert.deepEqual(Query.toPrisma(), { take: 100 });
  });

  test('filter goes to where with the operators of Prisma as they are', () => {
    // Translates a filter with an operator
    const oArgs = Query.toPrisma({ filter: { price: { gte: 1000 } } });

    // Checks that it is not changed
    assert.deepEqual(oArgs, { where: { price: { gte: 1000 } }, take: 100 });
  });

  test('top and skip go to take and skip, with no ceiling', () => {
    // Translates a large page and a zero skip
    const oArgs = Query.toPrisma({ top: 5000, skip: 0 });

    // Checks that both are kept as sent
    assert.deepEqual(oArgs, { take: 5000, skip: 0 });
  });

  test('orderby keeps the order of its fields and nests the dot notation', () => {
    // Translates a nested field and a plain one
    const oArgs = Query.toPrisma({ orderby: { 'user.name': 'asc', id: 'desc' } });

    // Checks the order and the nesting
    assert.deepEqual(oArgs.orderBy, [{ user: { name: 'asc' } }, { id: 'desc' }]);
  });

  test('select lists the fields of the model', () => {
    // Translates a list with spaces and an empty entry
    const oArgs = Query.toPrisma({ select: 'id, name,' });

    // Checks the fields
    assert.deepEqual(oArgs.select, { id: true, name: true });
  });
});
