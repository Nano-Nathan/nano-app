import { createRoute } from '../../../../src/app/creators';

/** A route that needs a permission of the admin role */
export default createRoute({
  permissions: { user: ['list'] },
  GET: async () => ({ message: 'users' }),
});
