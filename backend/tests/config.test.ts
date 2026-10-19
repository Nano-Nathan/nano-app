import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeConfig, INITIAL_CONFIG } from '../src/app/config';

describe('merge de configuración', () => {
  test('una sección parcial no borra el resto de los defaults', () => {
    // Overrides only cors
    const oConfig = mergeConfig({ packages: { cors: { origin: 'https://example.com' } } });

    // Checks that the other packages keep their defaults
    assert.ok(oConfig.packages?.helmet, 'helmet debe seguir activo');
    assert.ok(oConfig.packages?.express, 'express.json debe seguir configurado');
    assert.deepEqual(oConfig.packages?.cors, { origin: 'https://example.com' });
  });

  test('un paquete se desactiva pasándolo en false/undefined', () => {
    // Turns helmet off
    const oConfig = mergeConfig({ packages: { helmet: false } });

    // Checks that only helmet changed
    assert.equal(oConfig.packages?.helmet, false);
    assert.ok(oConfig.packages?.compression, 'el resto sigue activo');
  });

  test('los defaults quedan intactos', () => {
    // Merges a config that changes packages and settings
    mergeConfig({ packages: { helmet: false }, settings: { 'trust proxy': 1 } });

    // Checks that INITIAL_CONFIG was not mutated
    assert.equal(INITIAL_CONFIG.packages.helmet, true);
    assert.deepEqual(INITIAL_CONFIG.settings, {});
  });
});
