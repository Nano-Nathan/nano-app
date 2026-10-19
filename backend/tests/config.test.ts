import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeConfig, INITIAL_CONFIG } from '../src/app/config';

describe('config merge', () => {
  test('a partial section keeps the other defaults', () => {
    // Overrides only cors
    const oConfig = mergeConfig({ packages: { cors: { origin: 'https://example.com' } } });

    // Checks that the other packages keep their defaults
    assert.ok(oConfig.packages?.helmet, 'helmet stays on');
    assert.ok(oConfig.packages?.express, 'express.json stays configured');
    assert.deepEqual(oConfig.packages?.cors, {
      ...INITIAL_CONFIG.packages.cors,
      origin: 'https://example.com',
    });
  });

  test('false turns a package off', () => {
    // Turns helmet off
    const oConfig = mergeConfig({ packages: { helmet: false } });

    // Checks that only helmet changed
    assert.equal(oConfig.packages?.helmet, false);
    assert.ok(oConfig.packages?.compression, 'the rest stays on');
  });

  test('a package is merged field by field with its default', () => {
    // Sets only the rate limit maximum
    const oConfig = mergeConfig({ packages: { rateLimit: { max: 100 } } });

    // Checks that the default message stays
    assert.deepEqual(oConfig.packages?.rateLimit, {
      max: 100,
      message: INITIAL_CONFIG.packages.rateLimit.message,
    });
  });

  test('the defaults are not mutated', () => {
    // Merges a config that changes packages and settings
    mergeConfig({ packages: { helmet: false }, settings: { 'trust proxy': 1 } });

    // Checks that INITIAL_CONFIG was not mutated
    assert.equal(INITIAL_CONFIG.packages.helmet, true);
    assert.deepEqual(INITIAL_CONFIG.settings, {});
  });
});
