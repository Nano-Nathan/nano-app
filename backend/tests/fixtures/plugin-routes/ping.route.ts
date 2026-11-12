import { createRoute } from '../../../src/lib/creators';

/** Route of a fixture plugin */
export default createRoute({
  GET: async () => ({ message: 'pong' }),
});
