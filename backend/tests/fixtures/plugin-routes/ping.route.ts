import { createRoute } from '../../../src/app/creators';

/** Route of a fixture plugin */
export default createRoute({
  GET: async () => ({ message: 'pong' }),
});
