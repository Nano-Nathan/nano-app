import { createRoute } from '../../../src/lib/creators';

/** Route to / */
export default createRoute({
  GET: async () => ({ message: 'root' }),
});
