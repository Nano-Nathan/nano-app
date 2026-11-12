import { createRoute } from '../../../../src/lib/creators';

/** Throws an Error, with no status */
export default createRoute({
  GET: async () => {
    throw new Error('boom');
  },
});
