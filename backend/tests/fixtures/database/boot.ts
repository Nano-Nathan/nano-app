import { createNanoApp } from '../../../src';
import type { NanoObject } from '@nano-app/core';

// Starts a real NanoApp in a child process, with the configuration passed as JSON
// in NANO_TEST_CONFIG, and prints READY once it is listening
const { schemaModule, authModule, ...oConfig }: NanoObject = JSON.parse(
  process.env.NANO_TEST_CONFIG ?? '{}',
);

// The app's Drizzle schema and its Better Auth options, from the modules the test names
const oDatabase = schemaModule
  ? { database: { ...oConfig.database, schema: await import(schemaModule) } }
  : {};
const oAuth = authModule ? { auth: (await import(authModule)).default } : {};

createNanoApp({
  port: 0,
  routesDir: 'tests/fixtures/routes',
  ...oConfig,
  ...oDatabase,
  ...oAuth,
  listener: () => console.log('READY'),
});
