import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, request } from './helpers';

describe('packages', () => {
  test('without packages the defaults are on', async () => {
    // Boots with no packages
    const oApp = await boot({});

    try {
      // Checks a header of helmet, on by default
      const { headers } = await fetch(`${oApp.url}/health`);
      assert.equal(headers.get('x-content-type-options'), 'nosniff', oApp.output());
    } finally {
      oApp.child.kill('SIGKILL');
    }
  });

  test('the packages of the consumer replace the defaults', async () => {
    // Boots with helmet off
    const oApp = await boot({ packages: { helmet: false } });

    try {
      // Checks that the header of helmet is gone
      const { headers } = await fetch(`${oApp.url}/health`);
      assert.equal(headers.get('x-content-type-options'), null, oApp.output());
    } finally {
      oApp.child.kill('SIGKILL');
    }
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
