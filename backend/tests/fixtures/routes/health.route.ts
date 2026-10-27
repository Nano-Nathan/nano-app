import { createRoute } from '../../../src/app/creators';

/** Route to /health */
export default createRoute({
  GET: async () => ({ result: { status: 'ok' } }),
  POST: async oReq => ({ status: 201, result: oReq.body }),
});
