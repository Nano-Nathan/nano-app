import express, { type Express } from "express";
import { spawn, type ChildProcess } from "node:child_process";
import type { Server } from "node:http";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { Plugin } from "../src/routes/Plugin";
import { errorHandler, notFoundHandler } from "../src/app/errors";
import type { PluginConfig } from "../src/types/plugin";

const FIXTURES_ROUTES = "tests/fixtures/routes";

/** Finds a free port by asking the system for one and releasing it right away */
export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

/** Mounts a plugin on a stub application and returns the registered paths */
export async function mountedPaths(config: Partial<PluginConfig>): Promise<string[]> {
  const paths: string[] = [];
  const stub = { all: (path: string) => { paths.push(path); } } as unknown as Express;

  await new Plugin({ name: "test", routesDir: "", ...config }).mount(stub);

  return paths.sort();
}

/**
 * Mounts the given plugins the same way `NanoApp` does — endpoints on a single
 * Express application, 404 and error handler last — and serves them on a free
 * port. The test owns the server, so it can close it when it is done.
 */
export async function startApp(plugins: Partial<PluginConfig>[] = [{ routesDir: FIXTURES_ROUTES }]): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  const app = express();
  app.use(express.json());

  for (const config of plugins) {
    await new Plugin({ name: "test", routesDir: "", ...config }).mount(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = await findFreePort();
  const server: Server = await new Promise(resolve => {
    const created = app.listen(port, () => resolve(created));
  });

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    ),
  };
}

/** Request helper: returns the status and the parsed body */
export async function request(url: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${url}${path}`, init);
  const text = await response.text();

  let body: any = text;
  try { body = JSON.parse(text); } catch { /* non-JSON response */ }

  return { status: response.status, body, headers: response.headers };
}

export type Booted = { child: ChildProcess; url: string; output: () => string; exited: Promise<number | null> };

/**
 * Starts `fixtures/database/boot.ts` in a child process: a real NanoApp with its
 * `process.exit` on startup failure. Resolves once it prints READY or exits.
 */
export async function boot(config: object, { env = {}, blockPrisma = false }: { env?: NodeJS.ProcessEnv; blockPrisma?: boolean } = {}): Promise<Booted> {
  const port = await findFreePort();
  const args = [...(blockPrisma ? ["--import", "./tests/fixtures/database/block-prisma.mjs"] : []), "--import", "tsx", "tests/fixtures/database/boot.ts"];

  const child = spawn(process.execPath, args, {
    env: { ...process.env, ...env, NANO_TEST_CONFIG: JSON.stringify({ port, ...config }) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  const exited = new Promise<number | null>(resolve => child.once("exit", resolve));

  await new Promise<void>(resolve => {
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes("READY")) resolve();
    };
    child.stdout!.on("data", onData);
    child.stderr!.on("data", onData);
    exited.then(() => resolve());
  });

  return { child, url: `http://127.0.0.1:${port}`, output: () => output, exited };
}
