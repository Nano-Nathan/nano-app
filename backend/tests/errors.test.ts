import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, request } from './helpers';

describe('manejo de errores del core', () => {
  let oServer: Awaited<ReturnType<typeof startApp>>;

  before(async () => {
    oServer = await startApp();
  });

  after(async () => {
    await oServer.close();
  });

  test('un throw con status y message se formatea como ApiResponse', async () => {
    // Requests the route that throws { status, message }
    const { status, body } = await request(oServer.url, '/throw/object');

    // Checks the status and the ApiResponse
    assert.equal(status, 409);
    assert.deepEqual(body, { success: false, warning: false, message: 'ya existe' });
  });

  test('un throw de string responde 400 con el texto como mensaje', async () => {
    // Requests the route that throws a string
    const { status, body } = await request(oServer.url, '/throw/string');

    // Checks that the string is the message of a 400
    assert.equal(status, 400);
    assert.deepEqual(body, { success: false, message: 'falta el campo name' });
  });

  test('un Error sin status responde 500 con su mensaje', async () => {
    // Requests the route that throws an Error
    const { status, body } = await request(oServer.url, '/throw/error');

    // Checks that it is a 500 with the Error's message
    assert.equal(status, 500);
    assert.equal(body.success, false);
    assert.equal(body.message, 'explotó');
  });

  test('el flag warning viaja en la respuesta', async () => {
    // Requests the route that throws a warning
    const { status, body } = await request(oServer.url, '/throw/warning');

    // Checks the status and the flag
    assert.equal(status, 422);
    assert.equal(body.warning, true);
  });

  test('un path sin ruta se formatea como 404', async () => {
    // Requests a path with no route
    const { status, body } = await request(oServer.url, '/no-existe');

    // Checks the 404 ApiResponse
    assert.equal(status, 404);
    assert.deepEqual(body, { success: false, warning: false, message: '/no-existe not found' });
  });

  test('un error en una ruta descubierta del disco también se formatea', async () => {
    // Requests a route loaded from disk that throws
    const { status, body } = await request(oServer.url, '/throw/object');

    // Checks that the error handler formatted it
    assert.equal(status, 409);
    assert.equal(body.message, 'ya existe');
  });
});
