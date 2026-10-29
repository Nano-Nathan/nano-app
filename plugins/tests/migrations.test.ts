import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

/** Statements an official plugin's migration never runs: they lose data of the consumers */
const DESTRUCTIVE = /\b(DROP\s+(TABLE|COLUMN|SCHEMA|TYPE|INDEX)|RENAME|TRUNCATE|DELETE\s+FROM)\b/i;

describe('migrations of the official plugins', () => {
  test('only add: no drop, rename, truncate or delete', () => {
    // Reads every migration, without its comments
    for (const sFile of globSync('*/migrations/*/migration.sql')) {
      const sSql = readFileSync(sFile, 'utf-8').replace(/--.*$/gm, '');

      // Checks that nothing in it loses data
      assert.doesNotMatch(sSql, DESTRUCTIVE, `${sFile} must only add: see plugins/README.md`);
    }
  });
});
