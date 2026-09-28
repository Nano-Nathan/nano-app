import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, request } from "./helpers";

describe("manejo de errores del core", () => {
  let server: Awaited<ReturnType<typeof startApp>>;

  before(async () => {
    server = await startApp();
  });

  after(async () => { await server.close(); });

  test("un throw con status y message se formatea como ApiResponse", async () => {
    const { status, body } = await request(server.url, "/throw/object");
    assert.equal(status, 409);
    assert.deepEqual(body, { success: false, warning: false, message: "ya existe" });
  });

  test("un throw de string responde 400 con el texto como mensaje", async () => {
    const { status, body } = await request(server.url, "/throw/string");
    assert.equal(status, 400);
    assert.deepEqual(body, { success: false, message: "falta el campo name" });
  });

  test("un Error sin status responde 500 con su mensaje", async () => {
    const { status, body } = await request(server.url, "/throw/error");
    assert.equal(status, 500);
    assert.equal(body.success, false);
    assert.equal(body.message, "explotó");
  });

  test("el flag warning viaja en la respuesta", async () => {
    const { status, body } = await request(server.url, "/throw/warning");
    assert.equal(status, 422);
    assert.equal(body.warning, true);
  });

  test("un path sin ruta se formatea como 404", async () => {
    const { status, body } = await request(server.url, "/no-existe");
    assert.equal(status, 404);
    assert.deepEqual(body, { success: false, warning: false, message: "/no-existe not found" });
  });

  test("un error en una ruta descubierta del disco también se formatea", async () => {
    const { status, body } = await request(server.url, "/throw/object");
    assert.equal(status, 409);
    assert.equal(body.message, "ya existe");
  });
});
