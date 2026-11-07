import { createNanoApp } from '../../../src';
import type { NanoObject } from '@nano-app/core';

// Starts a real NanoApp in a child process, with the configuration passed as JSON
// in NANO_TEST_CONFIG, and prints READY once it is listening
const oConfig: NanoObject = JSON.parse(process.env.NANO_TEST_CONFIG ?? '{}');

createNanoApp({
  port: 0,
  mainPlugin: { routesDir: 'tests/fixtures/routes' },
  ...oConfig,
  listener: () => console.log('READY'),
});
