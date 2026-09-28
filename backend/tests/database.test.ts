import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { FileLoader } from "@nano-app/core";
import { Database } from "../src/database/Database";
import { boot, request, type Booted } from "./helpers";

const FIXTURES = "tests/fixtures/database";
const SCHEMA = `${FIXTURES}/schema.prisma`;
const PLUGIN_SCHEMA = `${FIXTURES}/plugin.prisma`;
const MYSQL_SCHEMA = `${FIXTURES}/mysql.prisma`;

/** Generated clients (the generator `output` of each fixture schema) */
const CLIENT = `${FIXTURES}/generated/client/client.ts`;
const PLUGIN = `${FIXTURES}/generated/plugin/client.ts`;
const MYSQL = `${FIXTURES}/generated/mysql/client.ts`;

/** Runs the Prisma CLI of the backend's dev dependencies */
const prisma = (...args: string[]) =>
  execFileSync(process.execPath, [createRequire(import.meta.url).resolve("prisma/build/index.js"), ...args], { stdio: "ignore" });

/** Every client lives in .nano-app/prisma-clients/<name>: puts a fixture client there, or none */
const useClient = (name: string, fixture?: string) => {
  const dir = `.nano-app/prisma-clients/${name}/generated`;
  rmSync(dir, { recursive: true, force: true });
  if (fixture) cpSync(`${FIXTURES}/generated/${fixture}`, dir, { recursive: true });
};

// The generated clients are not versioned: the suite generates them (no database involved)
before(() => {
  for (const name of ["schema", "plugin", "mysql"]) prisma("generate", "--schema", `${FIXTURES}/${name}.prisma`);
});

describe("client validation", () => {
  // The adapter connects lazily: a URL that answers nothing is enough to instantiate clients
  const url = process.env.DATABASE_URL;
  before(async () => {
    process.env.DATABASE_URL = "postgres://unused@127.0.0.1:1/unused";
    await Database.init();
  });
  after(() => {
    if (url === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = url;
  });

  test("findPrismaClient validates the schema and loads the client class", async () => {
    assert.equal(typeof await FileLoader.findPrismaClient(CLIENT, SCHEMA), "function");
  });

  test("findPrismaClient fails when the client module cannot be loaded", async () => {
    await assert.rejects(FileLoader.findPrismaClient(`${FIXTURES}/generated/client`, SCHEMA), /could not be loaded/);
    await assert.rejects(FileLoader.findPrismaClient(`${FIXTURES}/missing/client.ts`, SCHEMA), /could not be loaded.*not found/);
  });

  test("the schema must be PostgreSQL; declaring schemas is optional", async () => {
    await assert.rejects(FileLoader.findPrismaClient(MYSQL, MYSQL_SCHEMA), /not a valid Prisma schema/);
    assert.equal(typeof await FileLoader.findPrismaClient(CLIENT, `${FIXTURES}/no-schemas.prisma`), "function");
  });

  test("a commented-out nano_* schema does not count", async () => {
    assert.equal(typeof await FileLoader.findPrismaClient(CLIENT, `${FIXTURES}/commented.prisma`), "function");
    useClient("commented", "client");
    assert.ok(await Database.mount("commented", { schemaPath: `${FIXTURES}/commented.prisma` }));
  });

  test("mount rejects a module that is not a Prisma client, and a client for another provider", async () => {
    useClient("route");
    mkdirSync(".nano-app/prisma-clients/route/generated", { recursive: true });
    writeFileSync(".nano-app/prisma-clients/route/generated/client.ts", "export const notAClient = true;\n");
    useClient("mysql", "mysql");

    await assert.rejects(Database.mount("route", { schemaPath: SCHEMA }), /Cannot instantiate the database "route"/);
    await assert.rejects(Database.mount("mysql", { schemaPath: SCHEMA }), /Cannot instantiate the database "mysql".*mysql/);
  });

  test("nano_* schemas are reserved for the plugins in plugins/", async () => {
    useClient("reserved", "plugin");
    await assert.rejects(Database.mount("reserved", { schemaPath: PLUGIN_SCHEMA }), /the nano_\* schemas are reserved for plugins/);
  });
});

describe("startup without a database", () => {
  test("an enabled database whose client cannot be loaded fails the startup", async () => {
    useClient("app");
    const app = await boot({ mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } }, { env: { DATABASE_URL: "postgres://unused@localhost/unused" } });

    assert.equal(await app.exited, 1);
    assert.match(app.output(), /prisma client of "app" does not exist. Run `npx nano-app generate app`/);
  });

  test("a database without DATABASE_URL fails the startup", async () => {
    useClient("app", "client");
    const app = await boot({ mainPlugin: { database: { enabled: true, schemaPath: SCHEMA } } }, { env: { DATABASE_URL: "" } });

    assert.equal(await app.exited, 1);
    assert.match(app.output(), /DATABASE_URL environment variable is not defined/);
  });

  test("a consumer schema declaring a nano_* schema fails the startup", async () => {
    useClient("app", "plugin");
    const database = { enabled: true, schemaPath: PLUGIN_SCHEMA };
    const app = await boot({ mainPlugin: { database } }, { env: { DATABASE_URL: "postgres://unused@localhost/unused" } });

    assert.equal(await app.exited, 1);
    assert.match(app.output(), /the nano_\* schemas are reserved for plugins/);
  });

  test("a disabled database is not mounted and the handlers receive no client", async () => {
    const database = { enabled: false, schemaPath: SCHEMA };
    const app = await boot({ mainPlugin: { routesDir: `${FIXTURES}/routes`, database } }, { env: { DATABASE_URL: "" } });

    try {
      const { body } = await request(app.url, "/has-db");
      assert.equal(body.result, false, app.output());
      assert.doesNotMatch(app.output(), /Database "app" mounted/);
    } finally {
      app.child.kill("SIGKILL");
    }
  });

  test("an app without a database neither loads nor needs Prisma", async () => {
    const app = await boot({}, { blockPrisma: true });

    const { status } = await request(app.url, "/health");
    assert.equal(status, 200, app.output());

    app.child.kill("SIGTERM");
    await app.exited;
    assert.doesNotMatch(app.output(), /BLOCKED/);
  });
});

describe("PostgreSQL", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not set" }, () => {
  let app: Booted;

  before(async () => {
    // What the consumer does by hand: apply their schema
    prisma("db", "push", "--schema", SCHEMA, "--url", process.env.DATABASE_URL!);

    useClient("app", "client");
    app = await boot({ mainPlugin: { routesDir: `${FIXTURES}/routes`, database: { enabled: true, schemaPath: SCHEMA } } });
    assert.match(app.output(), /READY/, app.output());
    assert.match(app.output(), /Database "app" mounted/);
  });

  after(() => { app?.child.kill("SIGKILL"); });

  test("the consumer's routes receive its client", async () => {
    const { body } = await request(app.url, "/has-db");
    assert.equal(body.result, true);
  });

  test("a consumer route receives the consumer's client and answers an ApiResponse", async () => {
    const title = `note-${Date.now()}`;

    const created = await request(app.url, "/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    assert.equal(created.status, 200);
    assert.equal(created.body.result.title, title);

    const listed = await request(app.url, "/notes");
    assert.equal(listed.status, 200);
    assert.ok(listed.body.result.some((note: { title: string }) => note.title === title));
  });
});
