import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { startApp, request, mountedPaths, boot } from "./helpers";
import { Plugin } from "../src/routes/Plugin";
import type { Express } from "express";

const PLUGIN_ROUTES = "tests/fixtures/plugin-routes";

describe("plugins", () => {
  test("mounts the routes discovered in its routesDir", async () => {
    const server = await startApp([{ routesDir: PLUGIN_ROUTES }]);

    const { status, body } = await request(server.url, "/ping");

    assert.equal(status, 200);
    assert.equal(body.message, "pong");

    await server.close();
  });

  test("prepends the base path to every endpoint", async () => {
    assert.deepEqual(await mountedPaths({ routesDir: PLUGIN_ROUTES, basePath: "/demo" }), ["/demo/ping"]);
  });

  test("a plugin with no routesDir mounts nothing", async () => {
    assert.deepEqual(await mountedPaths({ basePath: "/empty" }), []);
  });

  test("several plugins coexist on the same application", async () => {
    const server = await startApp([
      { routesDir: PLUGIN_ROUTES, basePath: "/first" },
      { routesDir: PLUGIN_ROUTES, basePath: "/second" },
    ]);

    assert.equal((await request(server.url, "/first/ping")).status, 200);
    assert.equal((await request(server.url, "/second/ping")).status, 200);

    await server.close();
  });

  test("discovers built .js route files and ignores their .d.ts", async () => {
    assert.deepEqual(await mountedPaths({ routesDir: "tests/fixtures/built-routes" }), ["/hello"]);
  });

  test("init runs once with the app and the client, before the endpoints", async () => {
    let calls = 0;
    const server = await startApp([{
      routesDir: PLUGIN_ROUTES,
      init: (app, db) => {
        calls++;
        assert.equal(db, undefined, "no database: no client");
        app.use((_req, res, next) => { res.set("x-init", "yes"); next(); });
      },
    }]);

    try {
      const { status, headers } = await request(server.url, "/ping");
      assert.equal(status, 200);
      assert.equal(headers.get("x-init"), "yes");
      assert.equal(calls, 1);
    } finally {
      await server.close();
    }
  });

  test("NanoApp mounts the plugins of each stage around the consumer routes, in order", async () => {
    const app = await boot({
      plugins: [
        { routesDir: PLUGIN_ROUTES, basePath: "/late", stage: "after" },
        { routesDir: PLUGIN_ROUTES, basePath: "/early" },
      ],
    });

    try {
      const mounted = [...app.output().matchAll(/\[INFO\] (\/\S*)/g)].map(([, path]) => path);
      assert.equal(mounted[0], "/early/ping", app.output());
      assert.equal(mounted.at(-1), "/late/ping");
      assert.ok(mounted.includes("/health"));
      assert.equal((await request(app.url, "/late/ping")).status, 200);
    } finally {
      app.child.kill("SIGKILL");
    }
  });

  test("a named plugin's database needs its client generated first", async () => {
    const plugin = new Plugin({ name: "missing", routesDir: "", database: { enabled: true, schemaPath: "" } });
    await assert.rejects(plugin.mount({ all: () => {} } as unknown as Express), /prisma client of "missing" does not exist. Run `npx nano-app generate missing`/);
  });

  test("nano-app forwards other commands to Prisma and requires a schema to generate", () => {
    const run = (...args: string[]) => spawnSync(process.execPath, ["--import", "tsx", "bin/nano-app.ts", ...args], { encoding: "utf-8" });

    const passthrough = run("--version");
    assert.match(passthrough.stdout + passthrough.stderr, /prisma/i, "any other command goes to Prisma");
    assert.match(run("generate", "missing").stderr, /"missing" has no schema/);
  });
});
