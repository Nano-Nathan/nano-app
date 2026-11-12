import { createRoute } from '../../../../src/lib/creators';

/** Fixture: index route with no expression */
export default createRoute({ GET: async () => ({}) });
