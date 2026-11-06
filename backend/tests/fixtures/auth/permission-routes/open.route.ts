import { createRoute } from '../../../../src/app/creators';

/** A public route with permissions: they are not checked */
export default createRoute({
  public: true,
  permissions: { notes: ['read'] },
  GET: async () => ({ message: 'open' }),
});
