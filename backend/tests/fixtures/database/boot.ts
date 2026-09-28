import { createNanoApp } from "../../../src";

/**
 * Starts a real NanoApp in a child process, with the configuration passed as JSON
 * in NANO_TEST_CONFIG, and prints READY once it is listening.
 */
createNanoApp({
  port: 0,
  mainPlugin: { routesDir: "tests/fixtures/routes" },
  ...JSON.parse(process.env.NANO_TEST_CONFIG ?? "{}"),
  listener: () => console.log("READY"),
});
