import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, request } from './helpers';

describe('packages', () => {
  test('a package set keeps the defaults of the others', async () => {
    // Boots a real NanoApp that sets only cors
    const oApp = await boot({ packages: { cors: { origin: 'https://example.com' } } });
    const { headers } = await request(oApp.url, '/health');
    oApp.child.kill('SIGKILL');

    // Checks its cors, and that helmet stays on
    assert.equal(headers.get('access-control-allow-origin'), 'https://example.com');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
  });

  test('false turns a package off', async () => {
    // Boots a real NanoApp without helmet
    const oApp = await boot({ packages: { helmet: false } });
    const { headers } = await request(oApp.url, '/health');
    oApp.child.kill('SIGKILL');

    // Checks that only helmet changed
    assert.equal(headers.get('x-content-type-options'), null);
    assert.equal(headers.get('access-control-allow-origin'), '*');
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
