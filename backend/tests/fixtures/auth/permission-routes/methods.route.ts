import { createRoute } from '../../../../src/lib/creators';

/** Permissions of the route, and others for POST: the admin role has none on notes, but lists users */
export default createRoute({
  permissions: { notes: ['read'] },
  GET: async () => ({ message: 'listed' }),
  POST: { handler: async () => ({ message: 'created' }), permissions: { user: ['list'] } },
});
