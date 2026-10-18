import { createPlugin } from "@nano-app/backend";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Health check: `GET /health` answers `{ status: "ok" }` while the server is up. */
export const health = createPlugin((options?: { basePath?: string }) => ({
  name: "health",
  basePath: options?.basePath ?? "/health",
  stage: "before",
  // Next to this file, from the sources and from the build
  routesDir: resolve(dirname(fileURLToPath(import.meta.url)), "routes"),
}));
