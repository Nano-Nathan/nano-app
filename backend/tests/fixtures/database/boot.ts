import { createNanoApp } from '../../../src';
import type { NanoObject } from '@nano-app/core';

// Starts a real NanoApp in a child process, with the configuration passed as JSON
// in NANO_TEST_CONFIG, and prints READY once it is listening
const { schemaModule, ...oConfig }: NanoObject = JSON.parse(process.env.NANO_TEST_CONFIG ?? '{}');

// The app's Drizzle schema, from the module the test names (JSON cannot carry it)
const oDatabase = schemaModule
  ? { database: { ...oConfig.database, schema: await import(schemaModule) } }
  : {};

createNanoApp({
  port: 0,
  routesDir: 'tests/fixtures/routes',
  ...oConfig,
  ...oDatabase,
  listener: () => console.log('READY'),
});
