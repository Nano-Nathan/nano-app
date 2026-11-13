import { createPlugin, createRoute } from '@nano-app/backend';

/** Health check: `GET /health` answers `{ status: "ok" }` while the server is up. */
export default createPlugin(() => ({
  name: 'health',
  basePath: '/health',
  routes: {
    // Answers that the server is up; probes ask without a session
    '/index': createRoute({
      public: true,
      GET: async () => ({ result: { status: 'ok' } }),
    }),
  },
}));
