import { createRoute } from '../../../src/lib/creators';

/** Route without callbacks, next to hook.route.ts */
export default createRoute({
  GET: async () => ({}),
});
