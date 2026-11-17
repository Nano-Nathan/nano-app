import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '@nano-app/core';
import { STORE } from '../src/utils/validations';

describe('store files', () => {
  test('a store must be an app or api store with object data', () => {
    // Checks that each invalid store throws naming its file
    const oInvalid = {
      none: 'not an object',
      kind: { type: 'other' },
      data: { type: 'app', data: 'not an object' },
    };
    for (const [sName, oStore] of Object.entries(oInvalid)) {
      assert.throws(
        () => Validator.validate(STORE, oStore, sName),
        new RegExp(`${sName}:\n`),
        sName,
      );
    }

    // Checks that the valid ones pass
    const oValid = {
      api: { type: 'api' },
      app: { type: 'app', data: { iCount: 0 } },
    };
    for (const [sName, oStore] of Object.entries(oValid)) {
      assert.deepEqual(Validator.validate(STORE, oStore, sName), oStore);
    }
  });
});
