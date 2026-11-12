import { createRoute } from '../../../../src/lib/creators';

/** A route that needs a permission the admin role lacks */
export default createRoute({
  permissions: { notes: ['read'] },
  GET: async () => ({ message: 'notes' }),
});
