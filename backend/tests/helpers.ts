import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import express from 'express';
import Plugin from '../src/routes/Plugin';
import { errorHandler, notFoundHandler } from '../src/app/errors';
import type { ChildProcess } from 'node:child_process';
import type { Server } from 'node:http';
import type { NanoObject } from '@nano-app/core';
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
): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  // Body parser first, as the base packages of NanoApp
  const oApp = express();
  oApp.use(express.json());

  // Mounts each plugin in order
  for (const oConfig of aPlugins) {
    await new Plugin({ name: 'test', routesDir: '', ...oConfig }).mount(oApp);
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

/** Runs the Prisma CLI of the backend's dev dependencies */
export function prisma(...aArgs: string[]): void {
  execFileSync(
    process.execPath,
    [createRequire(import.meta.url).resolve('prisma/build/index.js'), ...aArgs],
    { stdio: 'ignore' },
  );
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
  // any: the body is whatever the server answered
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
  // any: the body is whatever the server answered
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
export async function boot(
  oConfig: NanoObject,
  { oEnv = {}, isBlockPrisma = false }: { oEnv?: NodeJS.ProcessEnv; isBlockPrisma?: boolean } = {},
): Promise<Booted> {
  // Node flags: tsx, and the Prisma blocker when asked
  const iPort = await findFreePort();
  const aArgs = [
    ...(isBlockPrisma ? ['--import', './tests/fixtures/database/block-prisma.mjs'] : []),
    '--import',
    'tsx',
    'tests/fixtures/database/boot.ts',
  ];

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
