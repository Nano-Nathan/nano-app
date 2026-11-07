import { createNanoApp } from '../../../src';
import type { NanoObject } from '@nano-app/core';

// Starts a real NanoApp in a child process, with the configuration passed as JSON
// in NANO_TEST_CONFIG, and prints READY once it is listening
const oConfig: NanoObject = JSON.parse(process.env.NANO_TEST_CONFIG ?? '{}');

// Better Auth's options hold functions, lost in JSON: the auth fixture's, under the test's own
if (oConfig.packages?.betterAuth) {
  const { default: oAuth } = await import('../auth/auth');
  oConfig.packages.betterAuth = { ...oAuth.options, ...oConfig.packages.betterAuth };
}

createNanoApp({
  port: 0,
  mainPlugin: { routesDir: 'tests/fixtures/routes' },
  ...oConfig,
  listener: () => console.log('READY'),
});
