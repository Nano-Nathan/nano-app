import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mergeConfig, INITIAL_CONFIG } from "../src/app/config";

describe("merge de configuración", () => {
  test("una sección parcial no borra el resto de los defaults", () => {
    const config = mergeConfig({ packages: { cors: { origin: "https://example.com" } } });

    assert.ok(config.packages?.helmet, "helmet debe seguir activo");
    assert.ok(config.packages?.express, "express.json debe seguir configurado");
    assert.deepEqual(config.packages?.cors, { origin: "https://example.com" });
  });

  test("un paquete se desactiva pasándolo en false/undefined", () => {
    const config = mergeConfig({ packages: { helmet: false } });

    assert.equal(config.packages?.helmet, false);
    assert.ok(config.packages?.compression, "el resto sigue activo");
  });

  test("los defaults quedan intactos", () => {
    mergeConfig({ packages: { helmet: false }, settings: { "trust proxy": 1 } });

    assert.equal(INITIAL_CONFIG.packages.helmet, true);
    assert.deepEqual(INITIAL_CONFIG.settings, {});
  });
});
