import { join } from 'node:path';
import { createPlugin } from '@nano-app/backend';

/** Health check: `GET /health` answers `{ status: "ok" }` while the server is up. */
export default createPlugin((options?: { basePath?: string }) => ({
  name: 'health',
  basePath: options?.basePath ?? '/health',
  // Next to this file, from the sources and from the build
  routesDir: join(import.meta.dirname, 'routes'),
}));
