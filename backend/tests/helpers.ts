import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import express from 'express';
import Plugin from '../src/plugins/Plugin';
import { errorHandler, notFoundHandler } from '../src/app/handlers/errors';
import type { ChildProcess } from 'node:child_process';
import type { Server } from 'node:http';
import type { NanoObject } from '@nano-app/core';
import type DatabaseClient from '../src/database/clients/DatabaseClient';
import type { PluginConfig } from '../src/types/plugin';

const FIXTURES_ROUTES = 'tests/fixtures/routes';

/** Finds a free port by asking the system for one and releasing it right away */
export async function findFreePort(): Promise<number> {
  return new Promise((fnResolve, fnReject) => {
    // Listens on port 0, reads the port it got, and closes
    const oProbe = createServer();
    oProbe.once('error', fnReject);
    oProbe.listen(0, () => {
      const oAddress = oProbe.address();
      if (!oAddress || typeof oAddress === 'string') return fnReject(new Error('No port assigned'));
      oProbe.close(() => fnResolve(oAddress.port));
    });
  });
}

/**
 * Mounts the given plugins the same way `NanoApp` does — endpoints on a single
 * Express application, 404 and error handler last — and serves them on a free
 * port. The test owns the server, so it can close it when it is done.
 */
export async function startApp(
  aPlugins: Partial<PluginConfig>[] = [{ routesDir: FIXTURES_ROUTES }],
  oAppDB?: DatabaseClient,
): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  // Body parser first, as the base packages of NanoApp
  const oApp = express();
  oApp.use(express.json());

  // Registers each plugin in order, with the app's database, as NanoApp does
  for (const oConfig of aPlugins) {
    const aMounts = await new Plugin({ name: 'test', ...oConfig }).build(oAppDB);
    for (const { path, handler } of aMounts) oApp.all(path, handler);
  }

  // 404 and error handler last
  oApp.use(notFoundHandler);
  oApp.use(errorHandler);

  // Serves it on a free port
  const iPort = await findFreePort();
  const oServer: Server = await new Promise(fnResolve => {
    const oCreated = oApp.listen(iPort, () => fnResolve(oCreated));
  });

  return {
    url: `http://127.0.0.1:${iPort}`,
    close: () =>
      new Promise((fnResolve, fnReject) =>
        oServer.close(oError => (oError ? fnReject(oError) : fnResolve())),
      ),
  };
}

/** Drops the given Postgres schemas and pushes a Drizzle schema into them, as the consumer does with drizzle-kit */
export async function push(oSchema: NanoObject, aSchemas: string[]): Promise<void> {
  // A client of its own, closed once the schema is in place
  const { pushSchema } = await import('drizzle-kit/api-postgres');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const oDb = drizzle(process.env.DATABASE_URL ?? '');

  // Starts from empty schemas, then creates their tables
  for (const sSchema of aSchemas) await oDb.execute(`DROP SCHEMA IF EXISTS "${sSchema}" CASCADE`);
  const oFilter = {
    schemas: aSchemas,
    tables: undefined,
    entities: undefined,
    extensions: undefined,
  };
  const { apply } = await pushSchema(oSchema, oDb, oFilter);
  await apply();
  await oDb.$client.end();
}

/** Request helper: returns the status and the parsed body */
export async function request(
  sUrl: string,
  sPath: string,
  oInit: RequestInit = {},
): Promise<TestResponse> {
  // Sends the request and reads the body as text
  const oResponse = await fetch(`${sUrl}${sPath}`, oInit);
  const sText = await oResponse.text();

  // Parses the body when it is JSON
  let oBody: any = sText;
  try {
    oBody = JSON.parse(sText);
  } catch {
    // Keeps the text: the response is not JSON
  }

  return { status: oResponse.status, body: oBody, headers: oResponse.headers };
}

/** What `request` returns */
export type TestResponse = {
  status: number;
  body: any;
  headers: Headers;
};

/** A NanoApp started in a child process by `boot` */
export type Booted = {
  child: ChildProcess;
  url: string;
  output: () => string;
  exited: Promise<number | null>;
};

/**
 * Starts `fixtures/database/boot.ts` in a child process: a real NanoApp with its
 * `process.exit` on startup failure. Resolves once it prints READY or exits.
 */
export async function boot(oConfig: NanoObject, oEnv: NodeJS.ProcessEnv = {}): Promise<Booted> {
  // Node flags: tsx
  const iPort = await findFreePort();
  const aArgs = ['--import', 'tsx', resolve('tests/fixtures/database/boot.ts')];

  // The config travels as an env var
  const oChild = spawn(process.execPath, aArgs, {
    env: { ...process.env, ...oEnv, NANO_TEST_CONFIG: JSON.stringify({ port: iPort, ...oConfig }) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let sOutput = '';
  const oExited = new Promise<number | null>(fnResolve => oChild.once('exit', fnResolve));

  // Waits for READY or for the exit, collecting stdout and stderr
  await new Promise<void>(fnResolve => {
    const fnOnData = (oChunk: Buffer) => {
      sOutput += oChunk.toString();
      if (sOutput.includes('READY')) fnResolve();
    };
    oChild.stdout!.on('data', fnOnData);
    oChild.stderr!.on('data', fnOnData);
    oExited.then(() => fnResolve());
  });

  return {
    child: oChild,
    url: `http://127.0.0.1:${iPort}`,
    output: () => sOutput,
    exited: oExited,
  };
}
