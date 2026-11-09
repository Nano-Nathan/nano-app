import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import { mergeConfig, INITIAL_CONFIG } from '../src/app/config';
import { boot, request } from './helpers';

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
    assert.ok(oConfig.packages?.cors, 'the rest stays on');
  });

  test('nested objects are merged at every level', () => {
    // Sets only the morgan format and the main database flag
    const oConfig = mergeConfig({
      packages: { morgan: { format: ':method' } },
      mainPlugin: { database: { enabled: true } },
    });

    // Checks that the nested defaults stay
    assert.deepEqual(oConfig.packages.morgan, {
      ...INITIAL_CONFIG.packages.morgan,
      format: ':method',
    });
    assert.deepEqual(oConfig.mainPlugin.database, {
      enabled: true,
      schemaPath: INITIAL_CONFIG.mainPlugin.database.schemaPath,
    });
    assert.equal(oConfig.mainPlugin.name, 'app');
  });

  test('the defaults are not mutated', () => {
    // Merges a config that changes packages and settings
    mergeConfig({ packages: { helmet: false }, settings: { 'trust proxy': 1 } });

    // Checks that INITIAL_CONFIG was not mutated
    assert.equal(INITIAL_CONFIG.packages.helmet, true);
    assert.deepEqual(INITIAL_CONFIG.settings, { 'trust proxy': PRIVATE_NETWORKS });
  });
});

describe('client IP', () => {
  test('behind a private proxy it is the last address the proxies appended', async () => {
    // Boots a real NanoApp with the default settings
    const oApp = await boot({});

    // Sends a request from a local proxy: a forged IP, then the one the proxy appended
    const { body } = await request(oApp.url, '/ip', {
      headers: { 'x-forwarded-for': '198.51.100.1, 203.0.113.1' },
    });
    oApp.child.kill('SIGKILL');

    // Checks that Express reads the appended one
    assert.equal(body.result, '203.0.113.1');
  });
});

describe('request log', () => {
  test('the default format logs the path without its query string', async () => {
    // Boots a real NanoApp with the default packages
    const oApp = await boot({});

    // Waits for the log line of a request that carries a token in its query string
    const oLogged = new Promise<void>(fnResolve => {
      oApp.child.stdout!.on('data', () => {
        if (oApp.output().includes('GET /health')) fnResolve();
      });
    });
    await request(oApp.url, '/health?token=secret');
    await oLogged;
    oApp.child.kill('SIGKILL');

    // Checks that the path is logged and the token is not
    assert.match(oApp.output(), /GET \/health 200/);
    assert.doesNotMatch(oApp.output(), /secret/);
  });
});
