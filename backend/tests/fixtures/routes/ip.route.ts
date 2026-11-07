import { createRoute } from '../../../src/app/creators';

/** Route to /ip: the client IP that Express read */
export default createRoute({
  GET: async oReq => ({ result: oReq.ip }),
});
