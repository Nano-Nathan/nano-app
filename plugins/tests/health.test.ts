import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { startApp, request, mountedPaths } from "../../backend/tests/helpers";
import { health } from "../health";

describe("health", () => {
  test("answers GET /health with status ok", async () => {
    const server = await startApp([health()]);

    const { status, body } = await request(server.url, "/health");

    assert.equal(status, 200);
    assert.deepEqual(body.result, { status: "ok" });

    await server.close();
  });

  test("mounts on the given base path", async () => {
    assert.deepEqual(await mountedPaths(health({ basePath: "/status" })), ["/status"]);
  });
});
