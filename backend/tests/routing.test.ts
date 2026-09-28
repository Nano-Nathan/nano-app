import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, request, mountedPaths } from "./helpers";

describe("file path to express path", () => {
  const cases: [string, string | undefined, string][] = [
    ["tests/fixtures/paths/index", undefined, "/"],
    ["tests/fixtures/paths/index-expression", undefined, "/:entity"],
    ["tests/fixtures/paths/plain", undefined, "/service/test/:id"],
    ["tests/fixtures/paths/index", "/demo", "/demo"],
    ["tests/fixtures/paths/plain", "/demo", "/demo/service/test/:id"],
  ];

  for (const [routesDir, basePath, expected] of cases) {
    test(`${routesDir.split("/").pop()} + base ${basePath ?? "-"} → ${expected}`, async () => {
      assert.deepEqual(await mountedPaths({ routesDir, basePath }), [expected]);
    });
  }

  test("index-expression + base /demo → /demo/:entity", async () => {
    assert.deepEqual(await mountedPaths({ routesDir: "tests/fixtures/paths/index-expression", basePath: "/demo" }), ["/demo/:entity"]);
  });
});

describe("routes by file convention", () => {
  let server: Awaited<ReturnType<typeof startApp>>;

  before(async () => { server = await startApp(); });
  after(async () => { await server.close(); });

  test("index.route.ts is mounted on /", async () => {
    const { status, body } = await request(server.url, "/");
    assert.equal(status, 200);
    assert.deepEqual(body, { success: true, message: "root" });
  });

  test("health.route.ts is mounted on /health", async () => {
    const { status, body } = await request(server.url, "/health");
    assert.equal(status, 200);
    assert.deepEqual(body.result, { status: "ok" });
  });

  test("a nested route with an expression receives the params", async () => {
    const { status, body } = await request(server.url, "/service/test/42");
    assert.equal(status, 200);
    assert.deepEqual(body.result, { id: "42" });
  });

  test("success:false answers 400", async () => {
    const { status, body } = await request(server.url, "/service/test/42", { method: "DELETE" });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test("an undeclared method answers 405", async () => {
    const { status, body } = await request(server.url, "/health", { method: "PUT" });
    assert.equal(status, 405);
    assert.match(body.message, /not implemented/);
  });

  test("the JSON body reaches the handlers parsed", async () => {
    const { status, body } = await request(server.url, "/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hola: "mundo" }),
    });
    assert.equal(status, 200);
    assert.deepEqual(body.result, { hola: "mundo" });
  });

  test("an invalid file is discarded without taking down the other routes", async () => {
    const { status } = await request(server.url, "/broken");
    assert.equal(status, 404);

    const { status: healthStatus } = await request(server.url, "/health");
    assert.equal(healthStatus, 200);
  });
});
