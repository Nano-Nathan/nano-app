import { createRoute } from '../../../../src/lib/creators';

/** Throws a plain string */
export default createRoute({
  GET: async () => {
    throw 'Field name is required';
  },
});
