import { createRoute } from '../../../src/app/creators';

/** Route to / */
export default createRoute({
  GET: async () => ({ message: 'root' }),
});
