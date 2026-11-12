import { createRoute } from '@nano-app/backend';

/** Answers that the server is up */
export default createRoute({
  // Probes ask without a session
  public: true,
  GET: async () => ({ result: { status: 'ok' } }),
});
