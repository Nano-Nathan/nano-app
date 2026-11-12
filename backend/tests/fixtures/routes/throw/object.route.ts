import { createRoute } from '../../../../src/lib/creators';

/** Throws the shape the framework expects: { status, message } */
export default createRoute({
  GET: async () => {
    throw { status: 409, message: 'Already exists' };
  },
});
