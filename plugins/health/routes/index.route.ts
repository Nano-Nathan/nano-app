import { createRoute } from '@nano-app/backend';

/** Answers that the server is up */
export default createRoute({
  GET: async () => ({ success: true, result: { status: 'ok' } }),
});
