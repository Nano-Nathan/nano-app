import { createRoute } from '../../../../../src/lib/creators';

/** Fixture: nested route with an expression */
export default createRoute({ expression: '/:id', GET: async () => ({}) });
