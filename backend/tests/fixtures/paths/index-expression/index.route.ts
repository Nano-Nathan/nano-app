import { createRoute } from '../../../../src/lib/creators';

/** Fixture: index route with an expression */
export default createRoute({ expression: '/:entity', GET: async () => ({}) });
