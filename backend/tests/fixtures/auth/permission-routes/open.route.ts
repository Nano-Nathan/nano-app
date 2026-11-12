import { createRoute } from '../../../../src/lib/creators';

/** A public route with permissions: they are not checked */
export default createRoute({
  public: true,
  permissions: { notes: ['read'] },
  GET: async () => ({ message: 'open' }),
});
